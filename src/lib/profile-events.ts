export const PROFILE_UPDATED_EVENT = 'tinglebox:profile-updated';

export const notifyProfileUpdated = () => {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
};