# VST Manager

A modern desktop application for managing VST audio plugins with a beautiful, intuitive interface. Built with Nuxt.js and Electron, VST Manager helps you organize, search, and manage your audio plugin collection.

## Features

- **Plugin Scanning**: Automatically scan and discover VST plugins from configured directories
- **Database Management**: Store plugin information, metadata, and license keys
- **Advanced Filtering**: Search by name, manufacturer, and plugin type
- **Modern UI**: Beautiful dark theme with responsive design
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Plugin Screenshots**: View plugin interfaces and screenshots
- **Settings Management**: Configure VST scan paths and application preferences

## Screenshots

*Screenshots coming soon*

## Installation

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/shekler/vst-manager.git
cd vst-manager
```

2. Install dependencies:
```bash
# Using npm
npm install

# Using bun (recommended)
bun install

# Using pnpm
pnpm install

# Using yarn
yarn install
```

3. Start the development server:
```bash
# Using npm
npm run dev

# Using bun
bun run dev

# Using pnpm
pnpm dev

# Using yarn
yarn dev
```

The application will open in your default browser at `http://localhost:3000`.

### Running as Desktop App (Electron)

To run VST Manager as a desktop application during development:

```bash
# Using npm
npm run start

# Using bun
bun run start

# Using pnpm
pnpm start

# Using yarn
yarn start
```

**Note**: Make sure the development server is running first (`npm run dev`) before starting the Electron app.

### Building for Production

Build the application for production:

```bash
# Using npm
npm run build

# Using bun
bun run build

# Using pnpm
pnpm build

# Using yarn
yarn build
```

### Creating Desktop Application

Package the application as a desktop app:

```bash
# Using npm
npm run make

# Using bun
bun run make

# Using pnpm
pnpm make

# Using yarn
yarn make
```

## Usage

### First Time Setup

1. Launch VST Manager
2. Navigate to **Settings** to configure your VST plugin directories
3. Add the paths where your VST plugins are installed
4. Return to the main **Library** page
5. Click **Scan for VST Plugins** to discover your plugins

### Managing Plugins

- **View Library**: Browse all discovered plugins with filtering options
- **Search**: Use the search bar to find specific plugins
- **Filter**: Filter by manufacturer or plugin type
- **Plugin Details**: Click on plugins to view detailed information
- **Database Management**: Import/export plugin data or clear the database

### Settings

Configure the following in the Settings page:
- VST plugin scan paths
- Application preferences
- Database settings

## Development

### Project Structure

```
vst-manager/
├── components/          # Vue components
├── composables/         # Vue composables
├── pages/              # Application pages
├── server/             # API endpoints
├── assets/             # Static assets
├── public/             # Public files
├── tools/              # VST scanning tools
└── main.js             # Electron main process
```

### Technology Stack

- **Frontend**: Nuxt.js 4, Vue 3, Tailwind CSS
- **Desktop**: Electron
- **Database**: SQLite3
- **Build Tool**: Vite
- **Package Manager**: Bun (recommended)

### API Endpoints

- `GET /api/plugins` - List all plugins
- `GET /api/plugins/[id]` - Get specific plugin
- `PUT /api/plugins/[id]` - Update plugin
- `DELETE /api/plugins/[id]` - Delete plugin
- `POST /api/plugins/import` - Import plugins
- `POST /api/plugins/delete-all` - Clear database
- `GET /api/plugins/search` - Search plugins
- `GET /api/plugins/stats` - Get statistics
- `POST /api/vst/scan` - Scan for VST plugins
- `GET /api/settings` - Get settings
- `PUT /api/settings/[key]` - Update setting

### Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start Electron app
npm run start

# Package application
npm run package

# Create distributable
npm run make
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Vue.js and Nuxt.js best practices
- Use TypeScript for type safety
- Follow the existing code style and formatting
- Test your changes thoroughly
- Update documentation as needed

## Alpha Version Notice

⚠️ **This is currently an alpha version (v0.1.0-alpha).** 

- Bugs and errors may occur
- Avoid saving sensitive data in the app
- Report issues on [GitHub](https://github.com/shekler/vst-manager/issues)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Sven Wolf** - [GitHub](https://github.com/shekler)

## Support

- **Issues**: [GitHub Issues](https://github.com/shekler/vst-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shekler/vst-manager/discussions)

---

Made with ❤️ for the audio production community
