import {
	Action,
	ActionPanel,
	Icon,
	Grid,
	showToast,
	Toast,
	Color,
} from "@vicinae/api";
import { useEffect, useState } from "react";
import { promises as fs } from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";

const execAsync = promisify(exec);

const HOME = os.homedir();
const THEME_SOURCES = [
	path.join(HOME, ".config/omarchy/themes"),
	path.join(HOME, ".local/share/omarchy/themes"),
	"/usr/share/omarchy/themes",
	"/etc/omarchy/themes",
];
const CURRENT_THEME_DIR = path.join(HOME, ".config/omarchy/current/theme");
const BACKGROUNDS_DIR = path.join(CURRENT_THEME_DIR, "backgrounds");

type Theme = {
	name: string;
	path: string;
	previewImage?: string;
	source: string;
};

type Background = {
	name: string;
	path: string;
	ext: string;
};

type FilterType = "all" | "themes" | "wallpapers";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];

export default function ThemeBackgroundChanger() {
	const [themes, setThemes] = useState<Theme[]>([]);
	const [backgrounds, setBackgrounds] = useState<Background[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [currentTheme, setCurrentTheme] = useState<string>("");
	const [filter, setFilter] = useState<FilterType>("all");

	useEffect(() => {
		loadData();
	}, []);

	async function loadData() {
		setIsLoading(true);
		try {
			await Promise.all([loadAllThemes(), loadBackgrounds(), detectCurrentTheme()]);
		} catch (error) {
			showToast({ style: Toast.Style.Failure, title: "Error", message: String(error) });
		} finally {
			setIsLoading(false);
		}
	}

	async function detectCurrentTheme() {
		try {
			const realPath = await fs.realpath(CURRENT_THEME_DIR);
			setCurrentTheme(path.basename(realPath));
		} catch {
			setCurrentTheme("");
		}
	}

	async function loadAllThemes() {
		const allThemes: Theme[] = [];
		const seen = new Set<string>();

		for (const source of THEME_SOURCES) {
			try {
				const entries = await fs.readdir(source, { withFileTypes: true });
				for (const entry of entries) {
					if (!entry.isDirectory() || seen.has(entry.name)) continue;
					seen.add(entry.name);

					const themePath = path.join(source, entry.name);
					const previewPath = path.join(themePath, "preview.png");
					let previewImage: string | undefined;

					try {
						await fs.access(previewPath);
						previewImage = previewPath;
					} catch {}

					allThemes.push({
						name: entry.name,
						path: themePath,
						previewImage,
						source: source.includes(".local") ? "local" : source.includes(".config") ? "user" : "system",
					});
				}
			} catch {}
		}

		setThemes(allThemes.sort((a, b) => a.name.localeCompare(b.name)));
	}

	async function loadBackgrounds() {
		try {
			const entries = await fs.readdir(BACKGROUNDS_DIR, { withFileTypes: true });
			const list: Background[] = entries
				.filter((e) => e.isFile() && IMAGE_EXTENSIONS.includes(path.extname(e.name).toLowerCase()))
				.map((e) => ({
					name: e.name,
					path: path.join(BACKGROUNDS_DIR, e.name),
					ext: path.extname(e.name).toLowerCase().replace(".", "").toUpperCase(),
				}))
				.sort((a, b) => a.name.localeCompare(b.name));
			setBackgrounds(list);
		} catch {
			setBackgrounds([]);
		}
	}

	async function applyTheme(theme: Theme) {
		showToast({ style: Toast.Style.Animated, title: "Switching Theme", message: theme.name });
		try {
			await execAsync(`theme ${theme.name}`);
			showToast({ style: Toast.Style.Success, title: "Theme Active", message: `Now using ${theme.name}` });
			await loadData();
		} catch (error) {
			showToast({ style: Toast.Style.Failure, title: "Failed", message: String(error) });
		}
	}

	async function applyBackground(bg: Background) {
		showToast({ style: Toast.Style.Animated, title: "Setting Wallpaper", message: bg.name });
		try {
			await execAsync("pkill swaybg || true").catch(() => {});
			await execAsync(`swaybg -i "${bg.path}" -m fill &`);
			showToast({ style: Toast.Style.Success, title: "Wallpaper Set", message: bg.name });
		} catch (error) {
			showToast({ style: Toast.Style.Failure, title: "Failed", message: String(error) });
		}
	}

	async function setDefaultBg(bg: Background) {
		try {
			const link = path.join(CURRENT_THEME_DIR, "background");
			await fs.unlink(link).catch(() => {});
			await fs.symlink(bg.path, link);
			showToast({ style: Toast.Style.Success, title: "Default Wallpaper", message: `Set to ${bg.name}` });
		} catch (error) {
			showToast({ style: Toast.Style.Failure, title: "Failed", message: String(error) });
		}
	}

	const showThemes = filter === "all" || filter === "themes";
	const showWallpapers = filter === "all" || filter === "wallpapers";

	return (
		<Grid
			isLoading={isLoading}
			searchBarPlaceholder="Search your collection..."
			columns={5}
			fit={Grid.Fit.Contain}
			aspectRatio="16/9"
			searchBarAccessory={
				<Grid.Dropdown
					tooltip="Filter by type"
					storeValue
					onChange={(val) => setFilter(val as FilterType)}
				>
					<Grid.Dropdown.Item title="All" value="all" icon={Icon.AppWindowGrid3x3} />
					<Grid.Dropdown.Item title="Themes" value="themes" icon={Icon.Brush} />
					<Grid.Dropdown.Item title="Wallpapers" value="wallpapers" icon={Icon.Image} />
				</Grid.Dropdown>
			}
		>
			{/* Themes Section */}
			{showThemes && themes.length > 0 && (
				<Grid.Section
					title="Themes"
					subtitle={`${themes.length} installed`}
					aspectRatio="16/9"
					columns={5}
				>
					{themes.map((theme) => (
						<Grid.Item
							key={theme.path}
							title={theme.name}
							subtitle={theme.name === currentTheme ? "✦ Active" : theme.source}
							content={
								theme.previewImage
									? { source: theme.previewImage }
									: { color: theme.name === currentTheme ? Color.Green : Color.SecondaryText }
							}
							keywords={["theme", theme.name, theme.source]}
							accessory={
								theme.name === currentTheme
									? { icon: { source: Icon.Checkmark, tintColor: Color.Green }, tooltip: "Current theme" }
									: undefined
							}
							actions={
								<ActionPanel title={theme.name}>
									<ActionPanel.Section>
										<Action
											title="Apply Theme"
											icon={{ source: Icon.Switch, tintColor: Color.PrimaryText }}
											onAction={() => applyTheme(theme)}
										/>
									</ActionPanel.Section>
									<ActionPanel.Section title="Quick Actions">
										<Action.Open
											title="Open in File Manager"
											target={theme.path}
											icon={Icon.Finder}
											shortcut={{ modifiers: ["cmd"], key: "o" }}
										/>
										<Action.ShowInFinder
											title="Reveal in Finder"
											path={theme.path}
											shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
										/>
										<Action.CopyToClipboard
											title="Copy Path"
											content={theme.path}
											shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
										/>
									</ActionPanel.Section>
									<ActionPanel.Section>
										<Action
											title="Refresh"
											icon={Icon.RotateClockwise}
											shortcut={{ modifiers: ["cmd"], key: "r" }}
											onAction={loadData}
										/>
									</ActionPanel.Section>
								</ActionPanel>
							}
						/>
					))}
				</Grid.Section>
			)}

			{/* Wallpapers Section */}
			{showWallpapers && backgrounds.length > 0 && (
				<Grid.Section
					title="Wallpapers"
					subtitle={`${backgrounds.length} in current theme`}
					aspectRatio="16/9"
					columns={5}
				>
					{backgrounds.map((bg) => (
						<Grid.Item
							key={bg.path}
							title={bg.name.replace(/\.[^/.]+$/, "")}
							subtitle={bg.ext}
							content={{ source: bg.path }}
							keywords={["wallpaper", "background", bg.name, bg.ext]}
							actions={
								<ActionPanel title={bg.name}>
									<ActionPanel.Section>
										<Action
											title="Set as Wallpaper"
											icon={{ source: Icon.Desktop, tintColor: Color.PrimaryText }}
											onAction={() => applyBackground(bg)}
										/>
										<Action
											title="Set as Default"
											icon={{ source: Icon.Pin, tintColor: Color.Yellow }}
											onAction={() => setDefaultBg(bg)}
											shortcut={{ modifiers: ["cmd"], key: "d" }}
										/>
									</ActionPanel.Section>
									<ActionPanel.Section title="Quick Actions">
										<Action.Open
											title="Open in Viewer"
											target={bg.path}
											icon={Icon.Eye}
											shortcut={{ modifiers: ["cmd"], key: "o" }}
										/>
										<Action.ShowInFinder
											title="Reveal in Finder"
											path={bg.path}
											shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
										/>
										<Action.CopyToClipboard
											title="Copy Path"
											content={bg.path}
											shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
										/>
									</ActionPanel.Section>
									<ActionPanel.Section>
										<Action
											title="Refresh"
											icon={Icon.RotateClockwise}
											shortcut={{ modifiers: ["cmd"], key: "r" }}
											onAction={loadData}
										/>
									</ActionPanel.Section>
								</ActionPanel>
							}
						/>
					))}
				</Grid.Section>
			)}

			{/* Empty States */}
			{!isLoading && themes.length === 0 && backgrounds.length === 0 && (
				<Grid.EmptyView
					title="No Themes Found"
					description="Add themes to ~/.config/omarchy/themes"
					icon={{ source: Icon.Binoculars, tintColor: Color.SecondaryText }}
					actions={
						<ActionPanel>
							<Action.Open
								title="Open Themes Folder"
								target={path.join(HOME, ".config/omarchy/themes")}
								icon={Icon.Folder}
							/>
							<Action
								title="Refresh"
								icon={Icon.RotateClockwise}
								onAction={loadData}
							/>
						</ActionPanel>
					}
				/>
			)}

			{!isLoading && filter === "themes" && themes.length === 0 && (
				<Grid.EmptyView
					title="No Themes"
					description="Install themes to get started"
					icon={{ source: Icon.Brush, tintColor: Color.Orange }}
				/>
			)}

			{!isLoading && filter === "wallpapers" && backgrounds.length === 0 && (
				<Grid.EmptyView
					title="No Wallpapers"
					description="Add images to your current theme's backgrounds folder"
					icon={{ source: Icon.Image, tintColor: Color.Blue }}
				/>
			)}
		</Grid>
	);
}
