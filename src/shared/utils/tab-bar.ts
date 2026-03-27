import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { EdgeInsets } from 'react-native-safe-area-context';

export const getTabBarStyle = (
  route: any,
  insets: EdgeInsets,
) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'index';
  const shouldHide = routeName !== 'index';

  return {
    display: shouldHide ? 'none' : 'flex',
    height: shouldHide ? 0 : 70 + insets.bottom,
  } as const;
};
