import avatar1 from '../../assets/avatar/avatar-1.png';
import avatar2 from '../../assets/avatar/avatar-2.png';
import avatar3 from '../../assets/avatar/avatar-3.png';
import avatar4 from '../../assets/avatar/avatar-4.png';
import avatar5 from '../../assets/avatar/avatar-5.png';
import avatar6 from '../../assets/avatar/avatar-6.png';

export const AVATARS = [
  { id: 'avatar-1', name: 'Farmer Boy', src: avatar1 },
  { id: 'avatar-2', name: 'Farmer Girl', src: avatar2 },
  { id: 'avatar-3', name: 'Gamer Farmer', src: avatar3 },
  { id: 'avatar-4', name: 'Cap Farmer', src: avatar4 },
  { id: 'avatar-5', name: 'Happy Farmer', src: avatar5 },
  { id: 'avatar-6', name: 'Grand Farmer', src: avatar6 },
];

export const getAvatarSrc = (avatarId) => {
  const found = AVATARS.find((a) => a.id === avatarId);
  return found ? found.src : avatar1;
};
