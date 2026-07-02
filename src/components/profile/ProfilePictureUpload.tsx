import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import * as userService from '../../services/user.service';

interface ProfilePictureUploadProps {
  currentAvatar?: string | null;
  onUploadComplete: (avatarUrl: string | null) => void;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentAvatar,
  onUploadComplete,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const data = await userService.uploadAvatar(selectedFile);
      toast.success('Profile picture updated successfully!');
      onUploadComplete(data.user.avatar ?? null);
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload profile picture');
      setPreview(currentAvatar || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(currentAvatar || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);

    try {
      const updatedUser = await userService.removeAvatar();
      toast.success('Profile picture removed');
      setPreview(null);
      onUploadComplete(updatedUser.avatar ?? null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Avatar Display */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          {/* Avatar Circle */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-800 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl"
          >
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-white" />
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Upload Button Overlay */}
          {!selectedFile && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-colors"
            >
              <Upload className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Controls */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-medium flex items-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-medium flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remove Button */}
        {preview && !selectedFile && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRemove}
            disabled={isUploading}
            className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50"
          >
            Remove Photo
          </motion.button>
        )}
      </div>

      {/* Info Text */}
      <div className="text-center space-y-1">
        <p className="text-sm text-gray-400">
          Recommended: Square image, at least 400x400px
        </p>
        <p className="text-xs text-gray-500">
          Max size: 5MB • Formats: JPG, PNG, GIF
        </p>
      </div>
    </div>
  );
};
