package com.mattermost.networkclient.helpers;

import com.mattermost.networkclient.APIClientModule;

import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.text.TextUtils;
import android.webkit.MimeTypeMap;


import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;

public class DocumentHelper {
    private final static Context context = APIClientModule.context;
    private final static String CACHE_DIR_NAME = "NetworkClientCacheDir";

    public static String getRealPath(final Uri uri) {
        if (DocumentsContract.isDocumentUri(context, uri)) {
            if (isExternalStorageDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];

                if ("primary".equalsIgnoreCase(type)) {
                    return Environment.getExternalStorageDirectory() + "/" + split[1];
                }
            } else if (isDownloadsDocument(uri)) {
                final String id = DocumentsContract.getDocumentId(uri);
                if (!TextUtils.isEmpty(id)) {
                    if (id.startsWith("raw:")) {
                        return id.replaceFirst("raw:", "");
                    }
                    try {
                        return getPathFromSavingTempFile(context, uri);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                }
            } else if (isMediaDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];

                Uri contentUri = null;
                if ("image".equals(type)) {
                    contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                } else if ("video".equals(type)) {
                    contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                } else if ("audio".equals(type)) {
                    contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                }

                final String selection = "_id=?";
                final String[] selectionArgs = new String[] {
                        split[1]
                };

                if (contentUri != null) {
                    return getDataColumn(context, contentUri, selection, selectionArgs);
                } else {
                    return getPathFromSavingTempFile(context, uri);
                }
            }
        }

        if ("content".equalsIgnoreCase(uri.getScheme())) {
            if (isGooglePhotosUri(uri)) {
                return uri.getLastPathSegment();
            }

            return getPathFromSavingTempFile(context, uri);
        } else if ("file".equalsIgnoreCase(uri.getScheme())) {
            return uri.getPath();
        }

        return null;
    }

    public static String getPathFromSavingTempFile(Context context, final Uri uri) {
        File tmpFile;
        String fileName = null;

        if (uri == null || uri.isRelative()) {
            return null;
        }

        try {
            Cursor returnCursor =
                    context.getContentResolver().query(uri, null, null, null, null);
            int nameIndex = returnCursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
            returnCursor.moveToFirst();
            fileName = sanitizeFilename(returnCursor.getString(nameIndex));

        } catch (Exception e) {
            // just continue to get the filename with the last segment of the path
        }

        try {
            if (TextUtils.isEmpty(fileName)) {
                fileName = sanitizeFilename(uri.getLastPathSegment().toString().trim());
            }


            File cacheDir = new File(context.getCacheDir(), CACHE_DIR_NAME);
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }

            String mimeType = getMimeType(uri.getPath());
            tmpFile = new File(cacheDir, fileName);
            tmpFile.createNewFile();

            ParcelFileDescriptor pfd = context.getContentResolver().openFileDescriptor(uri, "r");

            FileChannel src = new FileInputStream(pfd.getFileDescriptor()).getChannel();
            FileChannel dst = new FileOutputStream(tmpFile).getChannel();
            dst.transferFrom(src, 0, src.size());
            src.close();
            dst.close();
        } catch (IOException ex) {
            return null;
        }
        return tmpFile.getAbsolutePath();
    }

    public static String getDataColumn(Context context, Uri uri, String selection,
                                       String[] selectionArgs) {
        Cursor cursor = null;
        final String column = "_data";
        final String[] projection = {
                column
        };

        try {
            cursor = context.getContentResolver().query(uri, projection, selection, selectionArgs,
                    null);
            if (cursor != null && cursor.moveToFirst()) {
                final int index = cursor.getColumnIndexOrThrow(column);
                return cursor.getString(index);
            }
        } finally {
            if (cursor != null)
                cursor.close();
        }
        return null;
    }


    public static boolean isExternalStorageDocument(Uri uri) {
        return "com.android.externalstorage.documents".equals(uri.getAuthority());
    }

    public static boolean isDownloadsDocument(Uri uri) {
        return "com.android.providers.downloads.documents".equals(uri.getAuthority());
    }

    public static boolean isMediaDocument(Uri uri) {
        return "com.android.providers.media.documents".equals(uri.getAuthority());
    }

    public static boolean isGooglePhotosUri(Uri uri) {
        return "com.google.android.apps.photos.content".equals(uri.getAuthority());
    }

    public static String getExtension(String uri) {
        if (uri == null) {
            return null;
        }

        int dot = uri.lastIndexOf(".");
        if (dot >= 0) {
            return uri.substring(dot);
        } else {
            // No extension.
            return "";
        }
    }

    public static String getMimeType(File file) {

        String extension = getExtension(file.getName());

        if (extension.length() > 0)
            return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension.substring(1));

        return "application/octet-stream";
    }

    public static String getMimeType(String filePath) {
        File file = new File(filePath);
        return getMimeType(file);
    }

    private static String sanitizeFilename(String filename) {
        if (filename == null) {
            return null;
        }

        File f = new File(filename);
        return f.getName();
    }
}
