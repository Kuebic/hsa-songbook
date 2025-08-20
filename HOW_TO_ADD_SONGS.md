# How to Add Songs to HSA Songbook

## For Guest Users

As a guest user, you can add songs to the HSA Songbook! Here's how:

### Steps to Add a Song:

1. **Navigate to the Songs Page**
   - Go to http://localhost:5174/songs (or your dev server URL)
   - Or click on "Songs" in the navigation menu

2. **Click "Add New Song" Button**
   - Look for the blue "Add New Song" button in the top-right corner of the page
   - This button is visible for all logged-in users (including guests)

3. **Fill Out the Song Form**
   - **Title** (required): Enter the song title
   - **Artist**: Enter the artist or composer name
   - **Year**: Enter the composition year
   - **CCLI Number**: Enter the CCLI number if available (5-7 digits)
   - **Category** (required): Select from the dropdown menu
   - **Themes** (required): Add 1-10 themes/tags for the song
     - Type a theme and click "Add" or press Enter
     - Suggestions will appear as you type
   - **Notes**: Add any additional notes about the song

4. **Submit the Form**
   - Click "Create Song" to save your new song
   - You'll see a success notification
   - The page will redirect to the new song's detail page

### Features Available to Guest Users:

✅ **Create new songs** - Add songs to the catalog
✅ **View all songs** - Browse the entire song library
✅ **Search songs** - Find songs by title, artist, or themes
✅ **View song details** - See full information about any song

### Guest User Notice

When adding songs as a guest, you'll see a notice reminding you that:
- You're adding the song as a guest user
- You can create an account later to manage your songs
- Your contributions are still saved and valuable!

### Duplicate Detection

The form automatically checks for duplicate songs as you type:
- **Yellow warning**: Similar songs found (you can still proceed)
- **Red warning**: Exact match found (submission will be blocked)

### Tips for Guest Users:

1. **Check for duplicates first** - Search the library before adding
2. **Be thorough** - Fill in as many fields as possible
3. **Use existing themes** - Check what themes are already in use
4. **Consider signing up** - Create an account to edit your songs later

## For Registered Users

Registered users have additional capabilities:
- Edit songs they created
- Delete songs they created
- Manage their song history

## For Administrators

Administrators can:
- Edit any song
- Delete any song
- Manage all content

## Troubleshooting

### "Add New Song" button not visible?
- Make sure you're logged in (even as a guest)
- Navigate to the /songs page
- Refresh the page if needed

### Form won't submit?
- Check that all required fields are filled:
  - Title is required
  - Category must be selected
  - At least one theme is required
- Look for red error messages under fields
- Check for duplicate warnings

### Changes not saving?
- Check your internet connection
- Look for error notifications
- Try refreshing and re-submitting

## Technical Details

The song management system uses:
- React forms with real-time validation
- Supabase for data persistence
- Fuzzy search for duplicate detection
- Auto-generated unique slugs for URLs
- Role-based permissions

For developers, see the implementation in:
- `/src/features/songs/components/SongManagementForm.tsx`
- `/src/features/songs/pages/SongListPage.tsx`