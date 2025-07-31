import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extract template and styles from AppLoading.vue component
function parseVueComponent() {
  const componentPath = path.join(__dirname, "..", "components", "AppLoading.vue");
  const componentContent = fs.readFileSync(componentPath, "utf8");

  // Extract template
  const templateMatch = componentContent.match(/<template>([\s\S]*?)<\/template>/);
  const template = templateMatch ? templateMatch[1].trim() : "";

  // Extract styles (remove scoped and :global() syntax for static HTML)
  const styleMatch = componentContent.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  let styles = styleMatch ? styleMatch[1] : "";

  // Remove :global() syntax and convert to regular CSS
  styles = styles.replace(/:global\(([^)]+)\)/g, "$1");

  return { template, styles };
}

const { template, styles: componentStyles } = parseVueComponent();

// Simple Vue component using extracted template
const AppLoadingComponent = {
  props: ["message"],
  template: template,
};

// Use extracted styles from component
const styles = `<style>\n${componentStyles}\n</style>`;

async function generateLoadingScreen(message, filename) {
  const app = createSSRApp({
    components: {
      AppLoading: AppLoadingComponent,
    },
    template: `<AppLoading :message="message" />`,
    data() {
      return {
        message: message,
      };
    },
  });

  const html = await renderToString(app);

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>VST Manager - ${message}</title>
  ${styles}
</head>
<body>
  ${html}
</body>
</html>
  `.trim();

  return fullHtml;
}

async function buildLoadingScreens() {
  const outputDir = path.join(__dirname, "..", "dist", "loading-screens");

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const screens = [
    { message: "Installing VST Manager...", filename: "installing-vst-manager.html" },
    { message: "Updating VST Manager...", filename: "updating-vst-manager.html" },
    { message: "Uninstalling VST Manager...", filename: "uninstalling-vst-manager.html" },
  ];

  for (const screen of screens) {
    console.log(`Generating ${screen.filename}...`);
    const html = await generateLoadingScreen(screen.message, screen.filename);
    const outputPath = path.join(outputDir, screen.filename);
    fs.writeFileSync(outputPath, html, "utf8");
    console.log(`✅ Generated ${screen.filename}`);
  }

  console.log("🎉 All loading screens generated!");
}

buildLoadingScreens().catch(console.error);
