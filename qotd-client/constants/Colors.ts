const tintColor = '#007AFF';

const Colors = {
  primary: tintColor,
  primaryLight: 'rgba(0, 122, 255, 0.10)',
  background: '#fff',
  border: '#f0f0f0',
  text: '#333',
  textSecondary: '#666',
  error: '#FF3B30',
  success: '#34C759',
  appTitle: 'rgb(233, 168, 61)',
  tint: tintColor,
  tabIconDefault: '#ccc',
  tabIconSelected: tintColor,
  
  // Poll-specific colors
  pollBackground: '#fafafa',
  pollBorder: '#e0e0e0',
  pollSelectedBorder: tintColor,
  pollSelectedBackground: '#f0f8ff',
  pollBarDefault: '#d1e7ff',
  pollBarVoted: tintColor,
  pollBarBackground: '#e8e8e8',
  pollPercentageText: '#666',
  
  // Fast reply highlight
  fastReplyBorder: '#ffd700',
} as const;

// For strongly typed theme access
export type ThemeColors = typeof Colors;
export default Colors;
