export const storageAvailable = (
  type: 'sessionStorage' | 'localStorage' | 'none',
) => {
  if (type === 'none') return false;
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    console.warn(
      `The ${type} of storage was not available. This session will not be saved locally.`,
      e,
    );
  }
  return false;
};
export default storageAvailable;
