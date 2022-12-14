import {View, Text} from 'react-native';
import {useContext, React} from 'react';
import {colors, sizes} from '../data/theme';
import {AppContext} from '../helper/AppContext';

/**
 * Renders a title string with appropriate styles
 * @param {String} text title text
 * @returns title render
 */
const Title = ({text}) => {
  const {theme} = useContext(AppContext);

  const styles = {
    headerStyle: {
      color: colors[theme].fgColor,
      fontSize: sizes.header,
      fontWeight: 'bold',
    },
  };

  return (
    <View>
      <Text style={styles.headerStyle}>{text}</Text>
    </View>
  );
};

export default Title;
