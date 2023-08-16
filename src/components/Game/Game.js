import { useState, useEffect, Fragment } from 'react';
import { Text, View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { colors, CLEAR, ENTER } from '../../constants';
import Keyboard from '../Keyboard';
import words from '../../words';
import styles from './styles';
import { copyArray, getDayOfTheYear, getDayKey } from '../../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EndScreen from '../EndScreen';
import Animated, {
  SlideInLeft,
  ZoomIn,
  FlipInEasyY,
} from 'react-native-reanimated';
const NUMBER_OF_TRIES = 6;

const dayOfTheYear = getDayOfTheYear();
const dayKey = getDayKey();

const Game = () => {
  // AsyncStorage.removeItem('@game');
  const word = words[dayOfTheYear];

  const letters = word.split('');

  const [rows, setRows] = useState(
    new Array(NUMBER_OF_TRIES).fill(new Array(letters.length).fill(''))
  );

  const [curRow, setCurRow] = useState(0);
  const [curCol, setCurCol] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (curRow > 0) {
      checkGameState();
    }
  }, [curRow]);

  useEffect(() => {
    if (loaded) {
      persistState();
    }
  }, [rows, curRow, curCol, gameState]);

  useEffect(() => {
    readState();
  }, []);

  const persistState = async () => {
    const dataForToday = {
      rows,
      curRow,
      curCol,
      gameState,
    };

    try {
      let existingStateString = await AsyncStorage.getItem('@game');
      const existingState = existingStateString
        ? JSON.parse(existingStateString)
        : {};

      existingState[dayKey] = dataForToday;

      const dataString = JSON.stringify(existingState);
      await AsyncStorage.setItem('@game', dataString);
    } catch (error) {
      console.log('Failed to write to Async Storage: ', error);
    }
  };

  const readState = async () => {
    const dataString = await AsyncStorage.getItem('@game');
    try {
      const data = JSON.parse(dataString);
      const day = data[dayKey];
      setRows(day.rows);
      setCurRow(day.curRow);
      setCurCol(day.curCol);
      setGameState(day.gameState);
    } catch (error) {
      console.log('There was an error parsing this state:', error);
    }
    setLoaded(true);
  };

  const checkGameState = () => {
    if (checkIfWon() && gameState !== 'won') {
      setGameState('won');
      Alert.alert(`You win!`);
    } else if (checkIfLost() && gameState !== 'lost') {
      Alert.alert(`You lost, try again tomorrow`);
      setGameState('lost');
    }
  };

  const checkIfWon = () => {
    const row = rows[curRow - 1];
    return row.every((letter, i) => letter === letters[i]);
  };

  const checkIfLost = () => {
    return !checkIfWon() && curRow === rows.length;
  };

  const onKeyPressed = (key) => {
    if (gameState !== 'playing') {
      return;
    }
    const updatedRows = copyArray(rows);

    // TODO: when reaches to position 5, keep the curent positoin at 5.
    if (key === CLEAR) {
      const prevCol = curCol - 1;
      if (prevCol >= 0) {
        updatedRows[curRow][prevCol] = '';
        setRows(updatedRows);
        setCurCol(prevCol);
      }
      return;
    }
    if (key === ENTER) {
      const guess = rows[curRow].join('');
      const validGuess = words.includes(guess);
      if (!validGuess) {
        Alert.alert(`${guess} in not a valid word`);
        setCurRow(curRow);
        setCurCol(5);
        return;
      }
      if (curCol === rows[0].length) {
        setCurRow(curRow + 1);
        setCurCol(0);
      }
      return;
    }

    if (curCol < rows[0].length) {
      updatedRows[curRow][curCol] = key;
      setRows(updatedRows);
      setCurCol(curCol + 1);
    }
  };

  const isCellActive = (row, col) => {
    return row === curRow && col === curCol;
  };
  const getCellBGColor = (row, col) => {
    const letter = rows[row][col];

    if (row >= curRow) {
      return colors.black;
    }
    if (letter === letters[col]) {
      return colors.primary;
    }
    if (letters.includes(letter)) {
      return colors.secondary;
    }
    return colors.darkgrey;
  };

  const getAllLettersWithColor = (color) => {
    return rows.flatMap((row, i) =>
      row.filter((cell, j) => getCellBGColor(i, j) === color)
    );
  };

  const getCellStyle = (i, j) => [
    styles.cell,
    {
      borderColor: isCellActive(i, j) ? colors.grey : colors.darkgrey,
      backgroundColor: getCellBGColor(i, j),
    },
  ];

  const greenCaps = getAllLettersWithColor(colors.primary);
  const yellowCaps = getAllLettersWithColor(colors.secondary);
  const greyCaps = getAllLettersWithColor(colors.darkgrey);
  if (!loaded) {
    return <ActivityIndicator />;
  }

  if (gameState !== 'playing') {
    return (
      <EndScreen
        won={gameState === 'won'}
        rows={rows}
        getCellBGColor={getCellBGColor}
      />
    );
  }
  return (
    <>
      <ScrollView style={styles.map}>
        {rows.map((row, i) => (
          <Animated.View
            entering={SlideInLeft.delay(i * 50)}
            style={styles.row}
            key={`row-${i}`}
          >
            {row.map((letter, j) => (
              <Fragment key={`fragment-${i}-${j}`}>
                {i < curRow && (
                  <Animated.View
                    entering={FlipInEasyY.delay(j * 200)}
                    key={`cell-color-${i}-${j}`}
                    style={getCellStyle(i, j)}
                  >
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </Animated.View>
                )}
                {i === curRow && !!letter && (
                  <Animated.View
                    entering={ZoomIn}
                    key={`cell-active-${i}-${j}`}
                    style={getCellStyle(i, j)}
                  >
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </Animated.View>
                )}
                {!letter && (
                  <View key={`cell-${i}-${j}`} style={getCellStyle(i, j)}>
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </View>
                )}
              </Fragment>
            ))}
          </Animated.View>
        ))}
      </ScrollView>

      <Keyboard
        onKeyPressed={onKeyPressed}
        greenCaps={greenCaps}
        yellowCaps={yellowCaps}
        greyCaps={greyCaps}
      />
    </>
  );
};

export default Game;
