export const i18n = {
  locale: 'zh-Hant',
  t(key) {
    return key;
  }
};

export function setLocale(newLocale) {
  if (newLocale) {
    i18n.locale = newLocale;
  }
}
