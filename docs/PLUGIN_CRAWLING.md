# Plugin Database Crawling

This document explains how to use the plugin database crawler to extract VST plugin information from external sources.

## Overview

The plugin crawler allows you to fetch VST plugin data from various online sources and save it to a local JSON file. This can be useful for:

- Building a comprehensive plugin database
- Researching available plugins
- Comparing plugin prices and features
- Creating plugin recommendations

## Legal and Ethical Considerations

⚠️ **Important**: Always respect the terms of service of websites you crawl:

1. **Check robots.txt** before crawling any website
2. **Respect rate limits** (default: 1 request per second)
3. **Review Terms of Service** for each website
4. **Use APIs when available** instead of scraping
5. **Don't overload servers** with excessive requests
6. **Respect copyright** and data ownership

## Available Sources

### 1. Plugin Boutique
- **URL**: https://www.pluginboutique.com/
- **Data**: Plugin names, manufacturers, prices, descriptions
- **API**: Available (preferred method)
- **Rate Limit**: 1 request/second

### 2. KVR Audio
- **URL**: https://www.kvraudio.com/
- **Data**: Plugin database, reviews, ratings
- **API**: Limited
- **Rate Limit**: 1 request/second

### 3. VST4FREE
- **URL**: https://www.vst4free.com/
- **Data**: Free VST plugins
- **API**: Limited
- **Rate Limit**: 1 request/second

## Usage

### Via Admin Interface

1. Navigate to `/admin/plugin-crawler`
2. Select the sources you want to crawl
3. Click "Start Crawl"
4. View results and sample data

### Via API

```bash
# Crawl all sources
curl -X POST "http://localhost:3000/api/plugins/crawl"

# Crawl specific sources
curl -X POST "http://localhost:3000/api/plugins/crawl?sources=pluginboutique,kvr"
```

### Programmatically

```typescript
import { PluginDatabaseCrawler } from './server/utils/plugin-crawler';

const crawler = new PluginDatabaseCrawler({
  rateLimit: 1,
  maxRetries: 3,
  timeout: 10000
});

// Crawl all sources
const plugins = await crawler.crawlAll();

// Crawl specific source
const pbPlugins = await crawler.crawlPluginBoutique();
```

## Output Format

The crawler saves data to `data/crawled-plugins.json`:

```json
{
  "metadata": {
    "totalPlugins": 1500,
    "sources": ["Plugin Boutique", "KVR Audio"],
    "crawledAt": "2024-01-15T10:30:00.000Z"
  },
  "plugins": [
    {
      "name": "Pro-Q 3",
      "manufacturer": "FabFilter",
      "version": "3.5.0",
      "description": "Professional equalizer plugin",
      "price": "$169",
      "url": "https://www.fabfilter.com/products/pro-q-3-equalizer-plug-in",
      "category": "EQ",
      "platform": ["Windows", "macOS"],
      "source": "Plugin Boutique",
      "crawledAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Configuration

### Crawler Options

```typescript
interface CrawlerConfig {
  rateLimit: number;     // Requests per second (default: 1)
  maxRetries: number;    // Max retry attempts (default: 3)
  timeout: number;       // Request timeout in ms (default: 10000)
  outputPath: string;    // Output file path
}
```

### Rate Limiting

The crawler implements automatic rate limiting to be respectful to servers:

- Default: 1 request per second
- Exponential backoff on failures
- Configurable delays between sources

## Adding New Sources

To add a new plugin database source:

1. **Create a new method** in `PluginDatabaseCrawler`:

```typescript
async crawlNewSource(): Promise<PluginData[]> {
  console.log('Starting New Source crawl...');
  
  try {
    const data = await this.makeRequest('https://api.newsource.com/plugins');
    
    const plugins: PluginData[] = data.plugins?.map((plugin: any) => ({
      name: plugin.name,
      manufacturer: plugin.manufacturer,
      // ... map other fields
      source: 'New Source',
      crawledAt: new Date().toISOString()
    })) || [];
    
    this.plugins.push(...plugins);
    return plugins;
  } catch (error) {
    console.error('Failed to crawl New Source:', error);
    return [];
  }
}
```

2. **Add to the main crawl method**:

```typescript
async crawlAll(): Promise<PluginData[]> {
  await this.crawlPluginBoutique();
  await this.delay(1000 / this.config.rateLimit);
  
  await this.crawlNewSource(); // Add here
  await this.delay(1000 / this.config.rateLimit);
  
  await this.saveToFile();
  return this.plugins;
}
```

3. **Update the API endpoint** to include the new source.

## Error Handling

The crawler includes comprehensive error handling:

- **Retry logic** with exponential backoff
- **Graceful degradation** when sources fail
- **Detailed logging** for debugging
- **Partial results** saved even if some sources fail

## Best Practices

1. **Test with small datasets** first
2. **Monitor server responses** for rate limiting
3. **Implement proper error handling**
4. **Cache results** to avoid repeated requests
5. **Respect robots.txt** and terms of service
6. **Use APIs when available** instead of scraping

## Troubleshooting

### Common Issues

1. **Rate limiting**: Increase delays between requests
2. **Timeout errors**: Increase timeout value
3. **API changes**: Update parsing logic
4. **Network issues**: Check connectivity and retry

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG=plugin-crawler npm run dev
```

## Legal Disclaimer

This tool is provided for educational and research purposes. Users are responsible for:

- Complying with website terms of service
- Respecting rate limits and robots.txt
- Obtaining proper permissions when required
- Using data in accordance with copyright laws

The developers are not responsible for misuse of this tool. 