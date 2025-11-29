import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Normalize and validate the path
    const normalizedPath = path.normalize(filePath);
    
    // Extract filename from path (could be /app_data/exports/file.pptx or full path)
    let actualFilePath: string;
    
    if (normalizedPath.startsWith('/app_data/exports/')) {
      // If it's already a URL path, convert to file system path
      const appDataDir = process.env.APP_DATA_DIRECTORY || '/app_data';
      const relativePath = normalizedPath.replace('/app_data/exports/', '');
      actualFilePath = path.join(appDataDir, 'exports', relativePath);
    } else if (normalizedPath.includes('exports')) {
      // Extract path after exports directory
      const parts = normalizedPath.split('exports');
      if (parts.length > 1) {
        const appDataDir = process.env.APP_DATA_DIRECTORY || '/app_data';
        const afterExports = parts[parts.length - 1].replace(/^[\/\\]+/, '');
        actualFilePath = path.join(appDataDir, 'exports', afterExports);
      } else {
        actualFilePath = normalizedPath;
      }
    } else {
      // Assume it's already a full file system path
      actualFilePath = normalizedPath;
    }

    // Resolve to absolute path and check if it's within allowed directory
    const resolvedPath = path.resolve(actualFilePath);
    const appDataDir = process.env.APP_DATA_DIRECTORY || '/app_data';
    const exportsDir = path.resolve(path.join(appDataDir, 'exports'));
    
    console.log('Download request - Original path:', filePath);
    console.log('Download request - Resolved path:', resolvedPath);
    console.log('Download request - Exports dir:', exportsDir);
    console.log('Download request - APP_DATA_DIRECTORY:', appDataDir);
    
    // Security check: ensure file is within exports directory
    if (!resolvedPath.startsWith(exportsDir + path.sep) && resolvedPath !== exportsDir) {
      console.error('Unauthorized file access attempt:', resolvedPath, 'Expected to be in:', exportsDir);
      return NextResponse.json(
        { error: 'Access denied: File path not allowed' },
        { status: 403 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      console.error('File not found:', resolvedPath);
      // List files in exports directory for debugging
      try {
        if (fs.existsSync(exportsDir)) {
          const files = fs.readdirSync(exportsDir);
          console.log('Files in exports directory:', files);
        }
      } catch (e) {
        console.error('Error listing exports directory:', e);
      }
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check file stats to ensure it's not empty
    const stats = fs.statSync(resolvedPath);
    console.log('File stats - Size:', stats.size, 'bytes');
    if (stats.size === 0) {
      console.error('File is empty:', resolvedPath);
      return NextResponse.json(
        { error: 'File is empty or corrupted' },
        { status: 500 }
      );
    }

    // Read file as binary buffer
    const fileBuffer = fs.readFileSync(resolvedPath);
    const filename = path.basename(resolvedPath);
    const ext = path.extname(filename).toLowerCase();
    
    // Validate PPTX file signature (ZIP file format)
    if (ext === '.pptx' && fileBuffer.length > 0) {
      // PPTX files are ZIP archives, should start with PK (ZIP signature)
      const zipSignature = fileBuffer.slice(0, 2);
      if (zipSignature[0] !== 0x50 || zipSignature[1] !== 0x4B) {
        console.error('Invalid PPTX file: Not a valid ZIP archive', resolvedPath);
        console.error('File size:', fileBuffer.length, 'First bytes:', Array.from(fileBuffer.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        return NextResponse.json(
          { error: 'Invalid PPTX file format - file may be corrupted. File does not appear to be a valid ZIP archive.' },
          { status: 500 }
        );
      }
      
      // Additional validation: Check if it contains PPTX-specific files
      // PPTX files should contain [Content_Types].xml in the ZIP
      const fileContent = fileBuffer.toString('binary', 0, Math.min(1000, fileBuffer.length));
      const hasContentTypes = fileContent.includes('[Content_Types].xml') || 
                              fileContent.includes('ppt/') ||
                              fileContent.includes('application/vnd.openxmlformats');
      
      if (!hasContentTypes && fileBuffer.length < 1000) {
        console.warn('PPTX file may be invalid - missing expected PPTX structure indicators');
        console.log('File preview (first 200 chars):', fileContent.substring(0, 200));
      }
      
      console.log('Valid PPTX ZIP archive detected, size:', fileBuffer.length, 'bytes');
    }
    
    // Determine content type
    const contentTypeMap: Record<string, string> = {
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.pdf': 'application/pdf',
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Create response with binary data
    // Use Response instead of NextResponse to ensure proper binary handling
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}

