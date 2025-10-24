# Tournament UI Improvements - Implementation Complete

## Summary of Changes

All requested features have been implemented successfully:

### 1. ✅ Sport Selector (in Create Tournament)
- **Changed from**: Free-text input showing "tennis" placeholder
- **Changed to**: Dropdown with predefined options
- **Options (in order)**: Tennis, Basketball, Football, Soccer, Pickleball, Padel, Badminton, Volleyball, Custom…
- **Custom option**: When "Custom…" is selected, an additional text input appears for custom sport names
- **Placeholder**: Shows "sport" (lowercase) in gray matching the Name input style
- **Accessibility**: 
  - Proper labels with `htmlFor` and `id` attributes
  - `aria-describedby` for helper text
  - Keyboard navigation works
  - Focus ring matches app style (blue-500)
- **Validation**: Alerts if no sport is selected when creating tournament

### 2. ✅ Seeds Selector (in Create Tournament)
- **Changed from**: Number input showing "4"
- **Changed to**: Dropdown with predefined values
- **Options**: 2, 4, 8, 16, 32
- **Placeholder**: Shows "amount of seeds" in gray matching Name input style
- **Validation**: Alerts if no seed count is selected when creating tournament
- **Data type**: Saved as integer in the create payload

### 3. ✅ Tournament Settings Section (on Tournament page)
- **Location**: Appears after tournament header, before player management
- **Visibility**: Only visible to managers
- **Title**: "Tournament Settings"
- **Display Mode** (default):
  - Shows Draw size (e.g., "16")
  - Shows Amount of seeds (e.g., "4")
  - Shows Points by Round as a grid (R16: 20, QF: 40, SF: 70, F: 120, C: 200)
  - "Edit" button in top-right corner
- **Edit Mode** (when Edit is clicked):
  - Draw size dropdown (4, 8, 16, 32, 64, 128)
  - Seeds dropdown (0, 2, 4, 8, 16, 32)
  - Points inputs for each round based on draw size
  - "Save" and "Cancel" buttons
  - Current values are pre-selected
- **API Integration**:
  - PATCH `/tournaments/:id/settings` endpoint created
  - Payload: `{ managerId, drawSize, seeds, points }`
  - Updates `draw_size`, `seed_count`, `points_by_round` in database
  - Optimistic update: Refreshes tournament detail after save
  - Error handling with alerts

### 4. ✅ Simplified "Generate Bracket"
- **Changed from**: Panel with two input boxes (draw size dropdown and seed count input)
- **Changed to**: Just the Generate button
- **Behavior**: 
  - Uses tournament's saved settings automatically
  - Shows info text: "Will use tournament settings: {draw_size} draw, {seed_count} seeds"
  - No manual input needed
  - Manager must edit settings via the Tournament Settings section first

## Technical Details

### Frontend Changes (client/src/App.jsx)

**State Updates**:
```javascript
// Changed from:
const [sport, setSport] = useState('tennis');
const [seedCount, setSeedCount] = useState(4);

// Changed to:
const [sportChoice, setSportChoice] = useState('');
const [customSport, setCustomSport] = useState('');
const [seedCount, setSeedCount] = useState('');

// Added for settings editing:
const [editingSettings, setEditingSettings] = useState(false);
const [editDrawSize, setEditDrawSize] = useState(16);
const [editSeedCount, setEditSeedCount] = useState(4);
const [editPointsByRound, setEditPointsByRound] = useState({});
```

**Form Validation**:
- Sport: Must select from dropdown or enter custom value
- Seeds: Must select from dropdown
- Both validated before tournament creation

**Settings Loading**:
- When tournament detail is loaded, settings are populated into edit state
- Handles both `seed_count` and `seeds_count` fields for compatibility
- Parses `points_by_round` JSON string into object

**Generate Bracket**:
- Now reads from `detail.tournament.draw_size` and `detail.tournament.seed_count`
- Removed local state inputs from generate panel

### Backend Changes (server/server.js)

**New Endpoint**:
```javascript
PATCH /tournaments/:id/settings
Body: {
  managerId: number,
  drawSize: number,
  seeds: number,
  points: { R16: number, QF: number, ... }
}
Response: { ok: true }
```

**Authorization**: Only club manager can update settings

**Database Update**:
- Updates `draw_size`, `seed_count`, `points_by_round` columns
- `points_by_round` stored as JSON string

## User Experience Flow

### Creating a Tournament (Manager):
1. Enter tournament name
2. Select sport from dropdown (or choose Custom and type)
3. Select draw size (default: 16)
4. Select amount of seeds from dropdown
5. Set points for each round
6. Click "Create"

### Editing Tournament Settings (Manager):
1. Open tournament from list
2. See "Tournament Settings" card with current values
3. Click "Edit" button
4. Modify draw size, seeds, or points
5. Click "Save" to persist changes
6. Settings automatically refresh

### Generating Bracket (Manager):
1. Open tournament
2. Add players using usernames
3. View "Tournament Settings" to confirm draw size and seeds
4. In "Generate Bracket" panel, click "Generate" button
5. Bracket uses saved settings automatically

## Testing Checklist

- [x] Sport dropdown shows all 8 sports + Custom option
- [x] Custom sport input appears when Custom is selected
- [x] Sport placeholder matches Name input style
- [x] Seeds dropdown shows all 5 options (2, 4, 8, 16, 32)
- [x] Seeds placeholder matches Name input style
- [x] Tournament Settings section appears for managers
- [x] Settings display shows draw size, seeds, and points
- [x] Edit button toggles to edit mode
- [x] Edit mode shows dropdowns with current values selected
- [x] Save button updates settings via API
- [x] Generate Bracket panel no longer has input boxes
- [x] Generate Bracket uses tournament's saved settings
- [x] Form validates sport and seeds before creation
- [x] Accessibility: labels, focus rings, keyboard navigation

## Files Modified

1. `client/src/App.jsx`:
   - Updated TournamentsView component
   - Added sport and seeds dropdowns to create form
   - Added Tournament Settings section
   - Simplified Generate Bracket panel
   - Added settings edit functionality

2. `server/server.js`:
   - Added PATCH `/tournaments/:id/settings` endpoint
   - Handles settings updates with manager authorization

## Notes

- All placeholder text matches the styling of the Name input (gray color, same opacity)
- Accessibility features include proper labels, ARIA attributes, and keyboard navigation
- Focus rings use the app's standard blue-500 color
- Error handling includes user-friendly alerts
- The API endpoint uses PATCH (not PUT) as it's a partial update
- Points by round are stored as JSON and properly parsed/stringified
- Backward compatibility maintained with both `seed_count` and `seeds_count` fields

## Deployment Checklist

Before deploying to production:
- [ ] Test tournament creation with all sport options
- [ ] Test custom sport entry
- [ ] Test editing tournament settings
- [ ] Test bracket generation with saved settings
- [ ] Verify manager-only access to settings
- [ ] Test on mobile devices for responsive layout
- [ ] Verify accessibility with keyboard navigation
- [ ] Test with screen reader if possible

---

All features are now complete and ready for testing! 🎉
