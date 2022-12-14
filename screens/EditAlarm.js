import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeModules,
  Image,
  Animated,
  Easing,
} from 'react-native';
import React, {useState, useContext, useEffect} from 'react';
import Container from '../components/Container';
import Title from '../components/Title';
import {colors} from '../data/theme';
import {AppContext} from '../helper/AppContext';
import DatePicker from 'react-native-date-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {dropdownIcons} from '../data/icons';

const {AlarmModule} = NativeModules;

/**
 * Create / edit alarm page. Conditionally renders based on route.
 *
 * (Not yet implemented) if this page is navigated to from an existing alarm
 * fields will be prefilled with existing alarm data.
 *
 * @param {Object} route react navigation route
 * @param {Object} naviagation app navigation object
 * @returns render for create / edit alarm page
 */
const EditAlarm = ({route, navigation}) => {
  //Check if we have come from an existing alarm
  const alarm = typeof route.params === 'undefined' ? '' : route.params;
  const isExistingAlarm = alarm !== '';

  //Initialise date object to save time with correct timezone offset
  const dateObj = new Date(
    isExistingAlarm
      ? `2022-22-11T${alarm.hour < 10 ? '0' : ''}${alarm.hour}:${
          alarm.minute < 10 ? '0' : ''
        }${alarm.minute}:00.000Z`
      : null,
  );

  const timeZoneOffset = dateObj.getTimezoneOffset() * 60000;
  const dateAdjusted = new Date(dateObj.getTime() + timeZoneOffset);

  //Setup state variable with existing values if we are editing or default
  //values if we are creating a new alarm
  const [type, setType] = useState(
    isExistingAlarm ? alarm.type : 'Select Type',
  );
  const [sound, setSound] = useState(
    isExistingAlarm ? alarm.sound : 'Select Sound',
  );
  const [showTypes, setShowTypes] = useState(false);
  const [showSounds, setShowSounds] = useState(false);
  const [time, setTime] = useState(dateAdjusted);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeSet, setTimeSet] = useState(false);
  const [daysSelected, setDaysSelected] = useState(
    isExistingAlarm
      ? alarm.days
      : [false, false, false, false, false, false, false],
  );
  const {theme} = useContext(AppContext);
  const {width, height} = Dimensions.get('window');

  const options = ['Standard', 'NFC', 'Payment'];
  const sounds = ['Standard', 'Radio', 'Siren'];

  //Animations for inputs
  const timeShakeAnimation = new Animated.Value(0);
  const typeShakeAnimation = new Animated.Value(0);
  const soundShakeAnimation = new Animated.Value(0);

  const typeSpinValue = new Animated.Value(0);
  const soundSpinValue = new Animated.Value(0);

  /**
   * Begins rotation animation
   * @param {Animation} animation animation object to animate
   */
  const startSpin = animation => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        easing: Easing.linear, // Easing is an additional import from react-native
        useNativeDriver: true, // To make use of native driver for performance
      }),
      //Do nothing for a bit to prevent view reverting to initial state before we
      //rerender
      Animated.timing(animation, {
        toValue: 0,
        duration: 10000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      animation.setValue(0);
    });
  };

  // Interpolate beginning and end values for spin
  const typeSpin = typeSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const soundSpin = soundSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const animations = [typeShakeAnimation, soundShakeAnimation]; //time is a special case

  /**
   * Begins shake animation for specified animation
   * @param {Animation} animation animation object to animate
   */
  const startShake = animation => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Does nothing for a given number of ms
   * @param {Number} ms tme to wait
   * @returns {Promise} waiting finished
   */
  const delay = async (ms = 1000) =>
    new Promise(resolve => setTimeout(resolve, ms));

  //basic styling
  const styles = {
    text: {
      color: colors[theme].bgColor,
      paddingTop: 15,
      paddingBottom: 15,
      marginLeft: 20,
    },
    container: {
      flexDirection: 'column',
      justifyContent: 'center',
      marginTop: 10,
      borderRadius: 20,
      backgroundColor: colors[theme].fgColor,
    },
  };

  //Reset field entries when navigating away from screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!isExistingAlarm) {
        setShowSounds(false);
        setShowTypes(false);
        setType('Select Type');
        setSound('Select Sound');
        setTimeSet(false);
        setTime(new Date());
        setDaysSelected([false, false, false, false, false, false, false]);
      }
    });
    return unsubscribe;
  }, [navigation]);

  /**
   * Saves an alarm to phone using async storage and navigates user to home page.
   * Will not attempt to save an alarm if not all fields are filled in
   */
  const saveAlarm = async () => {
    if (type !== 'Select Type' && sound !== 'Select Sound' && timeSet) {
      try {
        //Find the old largest alarm id
        const existingKeys = await AsyncStorage.getAllKeys();
        const maxKey =
          existingKeys.length > 0
            ? existingKeys.reduce((max, current) =>
                parseInt(current) > parseInt(max) ? current : max,
              )
            : -1;

        //Save alarm
        const alarmJSON = JSON.stringify({
          type: type,
          sound: sound,
          id: parseInt(maxKey) + 1,
          hour: time.getHours(),
          minute: time.getMinutes(),
          days: daysSelected,
          enabled: true,
        });
        await AsyncStorage.setItem(
          (parseInt(maxKey) + 1).toString(),
          alarmJSON,
        );

        AlarmModule.createAlarm(
          parseInt(maxKey) + 1,
          time.getHours(),
          time.getMinutes(),
          daysSelected,
        );

        navigation.navigate('Home');
      } catch (e) {
        console.warn(error);
      }
    } else {
      //Shake animation on empty fields
      const inputs = [type, sound];
      const notSetValues = ['Select Type', 'Select Sound'];
      if (!timeSet) {
        startShake(timeShakeAnimation);
      }
      inputs.map((input, index) =>
        input === notSetValues[index] ? startShake(animations[index]) : null,
      );
    }
  };

  /**
   * Update settings for previously saved alarm
   * and return to home page
   */
  const updateAlarm = async () => {
    try {
      await AsyncStorage.setItem(
        alarm.id.toString(),
        JSON.stringify({
          ...alarm,
          type: type,
          hour: time.getHours(),
          minute: time.getMinutes(),
          sound: sound,
          days: daysSelected,
        }),
      );

      AlarmModule.updateAlarm(
        alarm.id,
        time.getHours(),
        time.getMinutes(),
        daysSelected,
      );

      navigation.navigate('Home');
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * Deletes the current alarm from phone storage and returns to
   * home page
   */
  const deleteAlarm = async () => {
    try {
      await AsyncStorage.removeItem(alarm.id.toString());

      AlarmModule.cancelAlarm(alarm.id);

      navigation.navigate('Home');
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * Creates a drop down picker component and saves chosen option
   * in useState variable
   *
   * To create an inital select message, initialise the useState variable
   * with this message
   * @param {Array} data array of options to choose from
   * @param {Text} value useState variable to store value
   * @param {Function} setValue setter function for useState value
   * @param {Boolean} shown state variable for showing dropdown
   * @param {Function} setShown setter function for shown
   * @param {Animation} animation animation object for this picker
   * @param {Animation.InterpolationConfigType} spin spin range for animation
   * @returns render for drop down picker
   */
  const DropdownPicker = ({
    data,
    value,
    setValue,
    shown,
    setShown,
    animation,
    spin,
  }) => {
    /**
     * Creates a single item within drop down list. Clicking
     * on this component will set the passed in state variable to
     * the component value
     * @param {Text} value value of dropdown item
     * @param {Number} index index of item in list
     * @param {Boolean} selected is this the currently selected value
     * @returns render for a drop down item
     */
    const DropdownItem = ({value, index, selected}) => {
      return (
        <TouchableOpacity
          style={{
            backgroundColor:
              value === selected ? colors[theme].fgColorLighter : null,
            borderBottomLeftRadius: index === data.length - 1 ? 20 : 0,
            borderBottomRightRadius: index === data.length - 1 ? 20 : 0,
          }}
          onPress={() => {
            setValue(value);
            setShown(false);
          }}>
          <Text style={styles.text}>{value}</Text>
        </TouchableOpacity>
      );
    };

    return (
      <TouchableOpacity
        style={styles.container}
        onPress={async () => {
          startSpin(animation);
          await delay(100);
          setShown(!shown);
        }}>
        <View style={{flexDirection: 'row'}}>
          <Text style={{...styles.text, fontWeight: 'bold', flex: 1}}>
            {value}
          </Text>
          <Animated.View
            style={{
              alignSelf: 'flex-end',
              width: 20,
              height: 20,
              marginBottom: 15,
              marginRight: 20,

              transform: [{rotate: spin}],
            }}>
            <Image
              source={
                shown
                  ? dropdownIcons[theme].chevronIconUp
                  : dropdownIcons[theme].chevronIconDown
              }
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
        {shown &&
          data.map((item, index) => (
            <DropdownItem
              index={index}
              selected={value}
              value={item}
              key={item}
            />
          ))}
      </TouchableOpacity>
    );
  };

  /**
   * Creates 'checkbox menu' for selecting days of the week
   * Days selected are stored in daysSelected state
   * @returns renders DaySelect menu
   */
  const DaySelect = () => {
    const days = ['Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'];

    /**
     * Toggles day in daySelected state
     * @param {Number} index index of day
     */
    const toggleDaySelected = index => {
      setDaysSelected([
        ...daysSelected.slice(0, index),
        !daysSelected[index],
        ...daysSelected.slice(index + 1),
      ]);
    };

    return (
      <View
        style={{
          marginTop: 20,
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={day}
            style={{
              width: 40,
              height: 40,
              borderRadius: 40,
              backgroundColor: daysSelected[index]
                ? colors[theme].fgColor
                : colors[theme].bgColor,
              borderColor: colors[theme].fgColor,
              borderWidth: 2,
              marginLeft: width / 80,
              marginRight: width / 80,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => toggleDaySelected(index)}>
            <Text
              style={{
                color: daysSelected[index]
                  ? colors[theme].bgColor
                  : colors[theme].fgColor,
              }}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Container
      children={
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'space-between',
            flexDirection: 'column',
          }}>
          <View style={{justifyContent: 'flex-start'}}>
            <Title text={isExistingAlarm ? 'Edit Alarm' : 'Create Alarm'} />
            <Animated.View
              style={{transform: [{translateY: timeShakeAnimation}]}}>
              <TouchableOpacity
                style={styles.container}
                onPress={() => {
                  setShowTimePicker(true);
                }}>
                <Text style={{...styles.text, fontWeight: 'bold'}}>
                  {timeSet || isExistingAlarm
                    ? `${time.getHours() % 12}:${
                        time.getMinutes() < 10 ? '0' : ''
                      }${time.getMinutes()} ${
                        time.getHours() >= 12 ? 'PM' : 'AM'
                      }`
                    : 'Select Time'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
            <DatePicker
              modal
              title="Select Time"
              mode="time"
              display="spinner"
              date={time}
              open={showTimePicker}
              onConfirm={date => {
                setShowTimePicker(false);
                setTime(date);
                setTimeSet(true);
              }}
              onCancel={() => {
                setShowTimePicker(false);
              }}
            />
            <Animated.View
              style={{transform: [{translateY: typeShakeAnimation}]}}>
              <DropdownPicker
                data={options}
                shown={showTypes}
                setShown={setShowTypes}
                value={type}
                setValue={setType}
                animation={typeSpinValue}
                spin={typeSpin}
              />
            </Animated.View>
            <Animated.View
              style={{transform: [{translateY: soundShakeAnimation}]}}>
              <DropdownPicker
                data={sounds}
                shown={showSounds}
                setShown={setShowSounds}
                value={sound}
                setValue={setSound}
                animation={soundSpinValue}
                spin={soundSpin}
              />
            </Animated.View>
            <DaySelect />
          </View>

          <View style={{justifyContent: 'flex-end', marginBottom: 20}}>
            {isExistingAlarm && (
              <TouchableOpacity
                onPress={() => deleteAlarm()}
                style={{
                  ...styles.container,
                  paddingLeft: 0,
                  backgroundColor: colors[theme].bgColor,
                  borderColor: colors[theme].fgColor,
                  borderWidth: 3,
                  flexDirection: 'row',
                  flex: 1,
                }}>
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      paddingTop: 15,
                      paddingBottom: 15,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: colors[theme].fgColor,
                    }}>
                    Delete
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => (isExistingAlarm ? updateAlarm() : saveAlarm())}
              style={{
                ...styles.container,
                flexDirection: 'row',
                flex: 1,
              }}>
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    color: colors[theme].bgColor,
                    paddingTop: 15,
                    paddingBottom: 15,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}>
                  Save
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      }
    />
  );
};

export default EditAlarm;
