import { Platform } from 'react-native';

const fontFamily = Platform.OS === 'ios' ? 'System' : 'Roboto';

export default {
  headline: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#000000',
  },
  subheadline: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    color: '#666666',
  },
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
  },
  caption: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
    color: '#999999',
  },
  cta: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bigNumber: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  sectionLabel: {
    fontFamily,
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};
