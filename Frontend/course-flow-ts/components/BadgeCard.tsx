import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeEntry } from '../services/api';
import { useTheme } from './ThemeContext';

type Props = {
  badge: BadgeEntry;
  size?: 'small' | 'large' | 'xl';
  onPress?: (badge: BadgeEntry) => void;
};

export default function BadgeCard({ badge, size = 'large', onPress }: Props) {
  const { theme } = useTheme();
  const isSmall = size === 'small';
  const isXl = size === 'xl';
  const cardSize = isSmall ? 72 : isXl ? 150 : 96;
  const iconSize = isSmall ? 22 : isXl ? 50 : 30;

  const iconName = badge.icon as keyof typeof Ionicons.glyphMap;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(badge)}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          width: cardSize,
          height: cardSize,
          borderRadius: isSmall ? 16 : isXl ? 32 : 22,
          backgroundColor: badge.earned ? theme.primary : theme.card,
          borderColor: badge.earned ? theme.primary : theme.border,
          opacity: badge.earned ? 1 : 0.45,
        },
      ]}
    >
      <Ionicons
        name={badge.earned ? iconName : 'lock-closed-outline'}
        size={iconSize}
        color={badge.earned ? '#fff' : theme.textSecondary}
      />
      {!isSmall && (
        <Text
          style={[styles.label, isXl && styles.labelXl, { color: badge.earned ? '#fff' : theme.textSecondary }]}
          numberOfLines={2}
        >
          {badge.name}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    padding: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 12,
  },
  labelXl: {
    fontSize: 13,
    lineHeight: 17,
    marginTop: 8,
  },
});
