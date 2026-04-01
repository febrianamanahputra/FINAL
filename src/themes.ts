export const THEMES = [
  { id: 'default', name: 'Default Light', category: 'App', font: '"DM Sans", sans-serif', colors: { primary: '#aaee00', primaryDark: '#7acc00', primaryText: '#2a4a00', bg: '#ffffff', text: '#1a1a1a', card: '#ffffff', border: 'rgba(0,0,0,0.15)' } },
  { id: 'spotify', name: 'Spotify Dark', category: 'App', font: '"Montserrat", sans-serif', colors: { primary: '#1DB954', primaryDark: '#1aa34a', primaryText: '#ffffff', bg: '#121212', text: '#FFFFFF', card: '#181818', border: '#282828' } },
  { id: 'discord', name: 'Discord Blurple', category: 'App', font: '"Outfit", sans-serif', colors: { primary: '#5865F2', primaryDark: '#4752c4', primaryText: '#ffffff', bg: '#36393f', text: '#dcddde', card: '#2f3136', border: '#202225' } },
  { id: 'instagram', name: 'Instagram Gradient', category: 'App', font: '"Poppins", sans-serif', colors: { primary: '#E1306C', primaryDark: '#c1285c', primaryText: '#ffffff', bg: '#FAFAFA', text: '#262626', card: '#FFFFFF', border: '#DBDBDB' } },
  { id: 'airbnb', name: 'Airbnb Clean', category: 'App', font: '"Montserrat", sans-serif', colors: { primary: '#FF5A5F', primaryDark: '#e04e52', primaryText: '#ffffff', bg: '#FFFFFF', text: '#484848', card: '#FFFFFF', border: '#EBEBEB' } },
  { id: 'slack', name: 'Slack Aubergine', category: 'App', font: '"DM Sans", sans-serif', colors: { primary: '#36C5F0', primaryDark: '#2ba6cb', primaryText: '#ffffff', bg: '#4A154B', text: '#FFFFFF', card: '#3F0E40', border: '#611f69' } },
  
  { id: 'valorant', name: 'Valorant Duelist', category: 'Game', font: '"Oswald", sans-serif', colors: { primary: '#FF4655', primaryDark: '#e03e4b', primaryText: '#ffffff', bg: '#0F1923', text: '#ECE8E1', card: '#1F2326', border: '#383E3A' } },
  { id: 'genshin', name: 'Genshin Paimon', category: 'Game', font: '"Nunito", sans-serif', colors: { primary: '#4A5366', primaryDark: '#3a4252', primaryText: '#ffffff', bg: '#F0EBE1', text: '#3D4555', card: '#FFFFFF', border: '#D9D3C8' } },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', category: 'Game', font: '"Rajdhani", sans-serif', colors: { primary: '#FCEE0A', primaryDark: '#d9cc08', primaryText: '#000000', bg: '#000000', text: '#00FF9F', card: '#111111', border: '#FCEE0A' } },
  { id: 'minecraft', name: 'Minecraft Stone', category: 'Game', font: '"VT323", monospace', colors: { primary: '#55FF55', primaryDark: '#44cc44', primaryText: '#000000', bg: '#7D7D7D', text: '#FFFFFF', card: '#8B8B8B', border: '#373737' } },
  { id: 'lol', name: 'League Hextech', category: 'Game', font: '"Cinzel", serif', colors: { primary: '#C8AA6E', primaryDark: '#a68d5b', primaryText: '#010A13', bg: '#010A13', text: '#A09B8C', card: '#0A1428', border: '#1E2328' } },

  { id: 'naruto', name: 'Naruto Sage', category: 'Anime', font: '"Permanent Marker", cursive', colors: { primary: '#FF7B00', primaryDark: '#cc6200', primaryText: '#ffffff', bg: '#1A1A1A', text: '#F2F2F2', card: '#2A2A2A', border: '#FF7B00' } },
  { id: 'zoro', name: 'Zoro (One Piece)', category: 'Anime', font: '"Oswald", sans-serif', colors: { primary: '#2E8B57', primaryDark: '#257046', primaryText: '#ffffff', bg: '#121212', text: '#E0E0E0', card: '#1E1E1E', border: '#2E8B57' } },
  { id: 'tanjiro', name: 'Tanjiro (Demon Slayer)', category: 'Anime', font: '"Nunito", sans-serif', colors: { primary: '#00A86B', primaryDark: '#008a58', primaryText: '#ffffff', bg: '#1A1A1A', text: '#F5F5F5', card: '#2A2A2A', border: '#8B0000' } },
  { id: 'eva', name: 'Eva Unit-01', category: 'Anime', font: '"Rajdhani", sans-serif', colors: { primary: '#76FF03', primaryDark: '#5ecc02', primaryText: '#311B92', bg: '#311B92', text: '#FFFFFF', card: '#4527A0', border: '#76FF03' } },
  { id: 'luffy', name: 'Luffy Gear 5', category: 'Anime', font: '"Poppins", sans-serif', colors: { primary: '#FFD700', primaryDark: '#ccac00', primaryText: '#1A1A1A', bg: '#FFFFFF', text: '#1A1A1A', card: '#F5F5F5', border: '#FFD700' } },

  { id: 'gundam', name: 'Gundam Mecha', category: 'Aesthetic', font: '"Rajdhani", sans-serif', colors: { primary: '#E53935', primaryDark: '#b72d2a', primaryText: '#ffffff', bg: '#ECEFF1', text: '#263238', card: '#FFFFFF', border: '#1E88E5' } },
  { id: 'akira', name: 'Akira Neo-Tokyo', category: 'Aesthetic', font: '"Oswald", sans-serif', colors: { primary: '#D50000', primaryDark: '#aa0000', primaryText: '#ffffff', bg: '#000000', text: '#FFFFFF', card: '#111111', border: '#D50000' } },
  { id: 'mlbb', name: 'MLBB Mythic', category: 'Aesthetic', font: '"Cinzel", serif', colors: { primary: '#FFB300', primaryDark: '#cc8f00', primaryText: '#121212', bg: '#121212', text: '#E0E0E0', card: '#1E1E1E', border: '#FFB300' } },
  { id: 'youtube', name: 'YouTube Studio', category: 'Aesthetic', font: '"Outfit", sans-serif', colors: { primary: '#FF0000', primaryDark: '#cc0000', primaryText: '#ffffff', bg: '#0F0F0F', text: '#F1F1F1', card: '#212121', border: '#303030' } },
  { id: 'netflix', name: 'Netflix Cinematic', category: 'Aesthetic', font: '"Bebas Neue", sans-serif', colors: { primary: '#E50914', primaryDark: '#b80710', primaryText: '#ffffff', bg: '#141414', text: '#FFFFFF', card: '#181818', border: '#404040' } },
];
