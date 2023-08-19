import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { colors, colorsToEmoji } from '../../constants';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  SlideInLeft,
  ZoomIn,
  FlipInEasyY,
} from 'react-native-reanimated';

const Number = ({ number, label }) => (
  <View style={{ alignItems: 'center', margin: 10 }}>
    <Text style={{ color: colors.lightgrey, fontSize: 30, fontWeight: 'bold' }}>
      {number}
    </Text>
    <Text style={{ color: colors.lightgrey, fontSize: 16, fontWeight: 'bold' }}>
      {label}
    </Text>
  </View>
);

const GuessDistributionLine = ({ position, amount, percentage }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Text style={{ color: colors.lightgrey }}>{position}</Text>
      <View
        style={{
          alignSelf: 'stretch',
          backgroundColor: colors.grey,
          margin: 5,
          padding: 5,
          width: `${percentage}%`,
          minWidth: 20,
        }}
      >
        <Text style={{ color: colors.lightgrey }}>{amount}</Text>
      </View>
    </View>
  );
};

const GuessDistribution = ({ distribution }) => {
  if (!distribution) {
    return null;
  }
  const sum = distribution.reduce((total, dist) => dist + total, 0);
  return (
    <>
      <Text style={styles.subtitle}>Guess distribution:</Text>
      <View style={{ width: '100%', padding: 20 }}>
        {distribution.map((dist, index) => (
          <GuessDistributionLine
            key={index}
            position={index + 1}
            amount={dist}
            percentage={(100 * dist) / sum}
          />
        ))}
      </View>
    </>
  );
};

const EndScreen = ({ won = false, rows, getCellBGColor }) => {
  const [secondsTillTomorrow, setsecondsTillTomorrow] = useState(0);
  const [played, setPlayed] = useState(0);
  const [curStreak, setCurStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [distribution, setDistribution] = useState(0);

  useEffect(() => {
    readState();
  }, [distribution]);

  const share = () => {
    const textMap = rows
      .map((row, i) =>
        row.map((cell, j) => colorsToEmoji[getCellBGColor(i, j)]).join('')
      )
      .filter((row) => row)
      .join('\n');
    const textToShare = `Wordle \n${textMap}`;
    Clipboard.setStringAsync(textToShare);
    Alert.alert('Score copied to clipboard');
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

      setsecondsTillTomorrow((tomorrow - now) / 1000);
    };
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const readState = async () => {
    const dataString = await AsyncStorage.getItem('@game');
    let data;
    try {
      data = JSON.parse(dataString);
    } catch (error) {
      console.log('There was an error parsing this state:', error);
    }
    const keys = Object.keys(data);
    const values = Object.values(data);

    setPlayed(keys.length);

    const numberOfWins = values.filter(
      (game) => game.gameState === 'won'
    ).length;
    setWinRate(Math.floor((100 * numberOfWins) / keys.length));

    let _curStreak = 0;
    let maxStreak = 0;
    let prevDay = 0;
    keys.forEach((key) => {
      const day = parseInt(key.split('-')[1]);
      if (data[key].gameState === 'won' && _curStreak === 0) {
        _curStreak += 1;
      } else if (data[key].gameState === 'won' && prevDay + 1 === day) {
        _curStreak += 1;
      } else {
        if (_curStreak > maxStreak) {
          maxStreak = _curStreak;
        }
        _curStreak = data[key].gameState === 'won' ? 1 : 0;
      }
      prevDay = day;
    });
    if (_curStreak > maxStreak) {
      maxStreak = _curStreak;
    }
    setCurStreak(_curStreak);
    setMaxStreak(maxStreak);

    const dist = [0, 0, 0, 0, 0, 0];

    values.map((game) => {
      if (game.gameState === 'won') {
        const tries = game.rows.filter((row) => row[0]).length;
        dist[tries] = dist[tries] + 1;
      }
    });
    setDistribution(dist);
  };

  const formatSeconds = () => {
    const hours = Math.floor(secondsTillTomorrow / (60 * 60));
    const minutes = Math.floor((secondsTillTomorrow % (60 * 60)) / 60);
    const seconds = Math.floor(secondsTillTomorrow % 60);

    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Animated.Text
        entering={SlideInLeft.springify().mass(0.5)}
        style={styles.title}
      >
        {won ? 'Congrats!' : 'try again tomorrow'}
      </Animated.Text>
      <Animated.View entering={SlideInLeft.delay(150).springify().mass(0.5)}>
        <Text style={styles.subtitle}>YOUR STATS:</Text>
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <Number number={played} label={'Played'} />
          <Number number={winRate} label={'Win %'} />
          <Number number={curStreak} label={'Cur Streak'} />
          <Number number={maxStreak} label={'Max Streak'} />
        </View>
      </Animated.View>
      <Animated.View entering={SlideInLeft.delay(300).springify().mass(0.5)} style={{width: '100%'}}>
        <GuessDistribution distribution={distribution} />
      </Animated.View>
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: colors.lightgrey }}>Next Wordle</Text>
          <Text
            style={{
              color: colors.lightgrey,
              fontSize: 24,
              fontWeight: 'bold',
            }}
          >
            {formatSeconds()}
          </Text>
        </View>
        <Pressable
          onPress={share}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            borderRadius: 25,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text>Share</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    color: 'white',
    textAlign: 'center',
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 20,
    color: colors.lightgrey,
    textAlign: 'center',
    marginVertical: 15,
    fontWeight: 'bold',
  },
});

export default EndScreen;
