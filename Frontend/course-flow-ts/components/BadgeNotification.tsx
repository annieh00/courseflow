import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeEntry } from '../services/api';

type Props = {
  badge: BadgeEntry | null;
  onDone: () => void;
};

export default function BadgeNotification({ badge, onDone }: Props) {
  const slideY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) return;

    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideY, { toValue: -120, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onDone());
    }, 3200);

    return () => clearTimeout(timer);
  }, [badge]);

  if (!badge) return null;

  const iconName = badge.icon as keyof typeof Ionicons.glyphMap;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideY }], opacity }]}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={26} color="#fff" />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>Achievement Unlocked</Text>
        <Text style={styles.name}>{badge.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>{badge.description}</Text>
      </View>
      <Text style={styles.trophy}>🏆</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#C8102E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  name: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 2 },
  desc: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  trophy: { fontSize: 28, marginLeft: 8 },
});
