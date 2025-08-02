# 🖼️ ImageResizer Pro

A professional, feature-rich bulk image resizer built with Vue 3, Vite, and TailwindCSS. Process multiple images with advanced resize algorithms, format conversion, and compression options.

![ImageResizer Pro](https://img.shields.io/badge/Vue-3.4.0-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-4.5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

## ✨ Features

### 🚀 Core Functionality

- **Bulk Image Processing** - Process up to 2000 images simultaneously with chunked processing
- **Multiple Resize Algorithms** - Lanczos, Bicubic, Bilinear, and Nearest Neighbor
- **Format Conversion** - Convert between JPEG, PNG, WebP, TIFF, and SVG formats
- **Quality Control** - Adjustable compression quality for optimal file sizes
- **Aspect Ratio Preservation** - Maintain original proportions or custom dimensions
- **Real Image Thumbnails** - See actual image previews instead of placeholders

### 🎨 User Experience

- **Drag & Drop Interface** - Intuitive file upload with visual feedback
- **Real-time Preview** - See processed images before download
- **Progress Tracking** - Detailed progress with speed and ETA estimates
- **Dark/Light Theme** - Automatic theme switching with system preference detection
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### 🔧 Advanced Features

- **Image Comparison** - Side-by-side, overlay, and slider comparison views
- **Advanced Settings** - Batch rename, EXIF preservation, watermarks, color profiles
- **Statistics Dashboard** - Detailed processing metrics and performance analytics
- **Memory Management** - Smart memory usage detection and optimization
- **Error Handling** - Comprehensive validation and error reporting
- **Browser Compatibility** - Automatic feature detection and fallbacks
- **ZIP Downloads** - Bulk download processed images as ZIP archive
- **Performance Optimization** - Chunked processing to prevent UI blocking
- **Auto-scroll** - Automatically scroll to progress when processing starts

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **Styling**: TailwindCSS with custom components
- **Icons**: Heroicons
- **Image Processing**: HTML5 Canvas API
- **File Handling**: JSZip, File-Saver
- **UI Components**: Headless UI

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd image-resizer

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Usage Guide

### Basic Usage

1. **Upload Images**: Drag and drop images or click to browse
2. **Configure Settings**: Choose dimensions, format, and quality
3. **Process Images**: Click the process button to start resizing
4. **Download Results**: Download individual images or all as ZIP

### Supported Formats

- **Input**: JPEG, PNG, WebP, GIF, BMP, TIFF, SVG
- **Output**: JPEG, PNG, WebP
- **Max File Size**: 100MB per image
- **Max Files**: 2000 images per batch

### Resize Options

- **Preset Sizes**: Thumbnail, Small, Medium, Large, HD, 4K
- **Custom Dimensions**: Set specific width and/or height
- **Aspect Ratio**: Maintain proportions or stretch to fit
- **Background Color**: For transparent images converted to JPEG

### Advanced Features

- **Batch Rename**: Custom naming patterns with variables like {index}, {timestamp}, {original}
- **EXIF Preservation**: Keep original metadata (camera info, GPS, etc.)
- **Watermarks**: Add text watermarks with customizable position and opacity
- **Progressive JPEG**: Better loading experience for web images
- **Color Profiles**: Support for sRGB, Adobe RGB, Display P3, and Rec. 2020
- **Processing Priority**: Choose between speed, balanced, or quality optimization
- **Image Comparison**: Compare original vs processed with multiple view modes
- **Statistics Dashboard**: Detailed analytics on processing performance and results

## 🎯 Performance Features

### Memory Optimization

- Automatic memory capacity detection
- Chunked processing for large batches
- Smart cleanup of temporary resources
- Progress indicators to prevent UI blocking

### Processing Algorithms

- **Lanczos**: Best quality, slower processing
- **Bicubic**: Good quality, moderate speed
- **Bilinear**: Fast processing, good quality
- **Nearest**: Fastest, best for pixel art

## 🔧 Configuration

### Environment Variables

```env
# Optional: Set custom limits
VITE_MAX_FILE_SIZE=52428800  # 50MB in bytes
VITE_MAX_FILES=100           # Maximum files per batch
```

### Customization

The application is highly customizable through:

- TailwindCSS configuration
- Vue component props
- Utility function parameters
- Theme system variables

## 📱 Browser Support

- **Chrome**: 88+ (Full support including WebP)
- **Firefox**: 85+ (Limited WebP support)
- **Safari**: 14+ (Limited WebP support)
- **Edge**: 88+ (Full support)

### Required Features

- HTML5 Canvas API
- File Reader API
- Blob API
- URL API

## 🧪 Testing

```bash
# Run unit tests (if configured)
npm run test

# Run e2e tests (if configured)
npm run test:e2e

# Type checking
npm run type-check
```

## 📦 Build & Deployment

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Analyze bundle size
npm run build -- --analyze
```

### Deployment Options

- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: AWS CloudFront, Cloudflare
- **Self-hosted**: Any web server with static file support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Vue 3 Composition API patterns
- Use TypeScript for type safety (if enabled)
- Maintain responsive design principles
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Vue.js team for the amazing framework
- TailwindCSS for the utility-first CSS framework
- Heroicons for the beautiful icon set
- Canvas API for client-side image processing

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include browser version and error messages

---

**Made with ❤️ using Vue 3, Vite, and TailwindCSS**
