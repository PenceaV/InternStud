import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Paper,
} from '@mui/material';
import { PhotoCamera, Link, Poll } from '@mui/icons-material';
import axios from 'axios';

interface CreatePostProps {
  onPostCreated?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [postType, setPostType] = useState('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('type', postType);
      if (image) {
        formData.append('image', image);
      }

      await axios.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset form
      setTitle('');
      setContent('');
      setImage(null);
      setPostType('text');

      // Notify parent component
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create a Post
        </Typography>

        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <InputLabel>Post Type</InputLabel>
          <Select
            value={postType}
            label="Post Type"
            onChange={(e) => setPostType(e.target.value)}
          >
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="image">Image</MenuItem>
            <MenuItem value="link">Link</MenuItem>
            <MenuItem value="poll">Poll</MenuItem>
          </Select>
        </FormControl>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ marginBottom: 2 }}
          />

          {postType === 'text' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              sx={{ marginBottom: 2 }}
            />
          )}

          {postType === 'image' && (
            <Box sx={{ marginBottom: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                >
                  Upload Image
                </Button>
              </label>
              {image && (
                <Typography variant="body2" sx={{ marginTop: 1 }}>
                  Selected: {image.name}
                </Typography>
              )}
            </Box>
          )}

          {postType === 'link' && (
            <TextField
              fullWidth
              label="URL"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              sx={{ marginBottom: 2 }}
              InputProps={{
                startAdornment: <Link sx={{ marginRight: 1 }} />,
              }}
            />
          )}

          {postType === 'poll' && (
            <Box sx={{ marginBottom: 2 }}>
              <TextField
                fullWidth
                label="Question"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                sx={{ marginBottom: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Options (one per line)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                helperText="Enter each option on a new line"
              />
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ marginBottom: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !title || (postType !== 'image' && !content)}
            fullWidth
          >
            {loading ? 'Creating...' : 'Create Post'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default CreatePost; 