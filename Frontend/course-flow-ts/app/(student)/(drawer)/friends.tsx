import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../components/ThemeContext';
import { FriendRequest, FriendUser, friendsAPI } from '../../../services/api';
import { useDegrees } from '../../../auth/DegreeContext';

const avatarFor = (friend: FriendUser) =>
  friend.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || friend.netid)}&background=C8102E&color=fff`;

export default function FriendsScreen() {
  const { theme } = useTheme();
  const { getDegreeName } = useDegrees();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [potentialFriends, setPotentialFriends] = useState<FriendUser[]>([]);
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadFriendsHub = async () => {
    try {
      const [friendsData, incomingData, outgoingData, potentialData] = await Promise.all([
        friendsAPI.getFriends(),
        friendsAPI.getIncomingRequests(),
        friendsAPI.getOutgoingRequests(),
        friendsAPI.getPotentialFriends(),
      ]);
      setFriends(friendsData);
      setIncomingRequests(incomingData);
      setOutgoingRequests(outgoingData);
      setPotentialFriends(potentialData);
    } catch (error) {
      console.error('Error loading friends hub:', error);
      Alert.alert('Friends unavailable', 'We could not load your friends right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFriendsHub();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchResults(await friendsAPI.searchUsers(trimmed));
      } catch (error) {
        console.error('Error searching friends:', error);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  const refresh = () => {
    setRefreshing(true);
    loadFriendsHub();
  };

  const runAction = async (id: number, action: () => Promise<unknown>) => {
    try {
      setBusyId(id);
      await action();
      await loadFriendsHub();
      if (query.trim().length >= 2) {
        setSearchResults(await friendsAPI.searchUsers(query.trim()));
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong.';
      Alert.alert('Friends update failed', message);
    } finally {
      setBusyId(null);
    }
  };

  const requestIdForUser = (userId: number) =>
    outgoingRequests.find((request) => request.receiver.id === userId)?.id;

  const formatDegrees = (degreeIds?: string[]) =>
    degreeIds?.filter(Boolean).map((id) => getDegreeName(id)).join(', ') ?? '';

  const viewFriendProfile = (friend: FriendUser) => {
    setSelectedFriend(null);
    router.push({
      pathname: '/(student)/(drawer)/friend-profile',
      params: {
        id: String(friend.id),
        netid: friend.netid,
        name: friend.name,
        email: friend.email,
        photoUrl: friend.photoUrl ?? '',
        bio: friend.bio ?? '',
        majors: JSON.stringify(friend.majors ?? []),
        minors: JSON.stringify(friend.minors ?? []),
        graduationYear: friend.graduationYear ?? '',
      },
    });
  };

  const discoverList = query.trim().length >= 2 ? searchResults : potentialFriends;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Gathering your campus circle...</Text>
      </View>
    );
  }

  const EmptyState = ({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) => (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={28} color={theme.primary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );

  const FriendAvatar = ({ friend, size = 52 }: { friend: FriendUser; size?: number }) => (
    <Image source={{ uri: avatarFor(friend) }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
  );

  const PersonMeta = ({ friend }: { friend: FriendUser }) => (
    <View style={styles.personTextWrap}>
      <Text style={styles.personName} numberOfLines={1}>{friend.name || `${friend.firstName ?? ''} ${friend.lastName ?? ''}`.trim() || friend.netid}</Text>
      <Text style={styles.personSubtext} numberOfLines={1}>@{friend.netid}{friend.graduationYear ? `  |  ${friend.graduationYear}` : ''}</Text>
      {friend.majors?.length > 0 && (
        <Text style={styles.personMajor} numberOfLines={1}>{formatDegrees(friend.majors)}</Text>
      )}
    </View>
  );

  const SectionHeader = ({ title, count, accent }: { title: string; count?: number; accent?: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {typeof count === 'number' && (
        <View style={[styles.countPill, accent ? { backgroundColor: accent } : null]}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </View>
  );

  const FriendCard = ({ friend }: { friend: FriendUser }) => (
    <TouchableOpacity style={styles.friendCard} onPress={() => setSelectedFriend(friend)} activeOpacity={0.86}>
      <FriendAvatar friend={friend} size={62} />
      <PersonMeta friend={friend} />
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const RequestCard = ({ request }: { request: FriendRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.personRow}>
        <FriendAvatar friend={request.sender} />
        <PersonMeta friend={request.sender} />
      </View>
      <View style={styles.requestButtons}>
        <TouchableOpacity
          style={[styles.smallButton, styles.ghostButton]}
          disabled={busyId === request.id}
          onPress={() => runAction(request.id, () => friendsAPI.rejectRequest(request.id))}
        >
          <Text style={styles.ghostButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, styles.primaryButton]}
          disabled={busyId === request.id}
          onPress={() => runAction(request.id, () => friendsAPI.acceptRequest(request.id))}
        >
          <Text style={styles.primaryButtonText}>{busyId === request.id ? 'Saving...' : 'Accept'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const DiscoverCard = ({ friend }: { friend: FriendUser }) => {
    const pendingRequestId = requestIdForUser(friend.id);
    const isAccepted = friend.friendshipStatus === 'ACCEPTED';
    const isPending = friend.friendshipStatus === 'PENDING' || Boolean(pendingRequestId);
    const canAdd = !isAccepted && !isPending;

    return (
      <View style={styles.discoverCard}>
        <View style={styles.personRow}>
          <FriendAvatar friend={friend} />
          <PersonMeta friend={friend} />
        </View>
        {isAccepted ? (
          <View style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={15} color={theme.primary} />
            <Text style={styles.statusText}>Friends</Text>
          </View>
        ) : isPending ? (
          <TouchableOpacity
            style={[styles.smallButton, styles.ghostButton]}
            disabled={busyId === pendingRequestId}
            onPress={() => pendingRequestId && runAction(pendingRequestId, () => friendsAPI.cancelRequest(pendingRequestId))}
          >
            <Text style={styles.ghostButtonText}>Requested</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.smallButton, styles.primaryButton]}
            disabled={!canAdd || busyId === friend.id}
            onPress={() => runAction(friend.id, () => friendsAPI.sendRequest(friend.id))}
          >
            <Text style={styles.primaryButtonText}>{busyId === friend.id ? 'Sending...' : 'Add'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <View>
            <Text style={styles.eyebrow}>CourseFlow Social</Text>
            <Text style={styles.heroTitle}>Friends</Text>
            <Text style={styles.heroSubtitle}>Find classmates, manage requests, and keep your academic circle close.</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeNumber}>{friends.length}</Text>
            <Text style={styles.heroBadgeLabel}>friends</Text>
          </View>
        </View>

        <View style={styles.searchCard}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, netid, or email"
            placeholderTextColor={theme.textSecondary}
            style={styles.searchInput}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <SectionHeader title="Incoming Requests" count={incomingRequests.length} accent="#F7B500" />
        {incomingRequests.length > 0 ? (
          incomingRequests.map((request) => <RequestCard key={request.id} request={request} />)
        ) : (
          <EmptyState icon="mail-open-outline" title="No pending requests" body="When someone adds you, their request will land here." />
        )}

        <SectionHeader title="Your Friends" count={friends.length} />
        {friends.length > 0 ? (
          friends.map((friend) => <FriendCard key={friend.id} friend={friend} />)
        ) : (
          <EmptyState icon="people-outline" title="Start your circle" body="Search for classmates above or add someone from Discover." />
        )}

        <SectionHeader title={query.trim().length >= 2 ? 'Search Results' : 'Discover People'} count={discoverList.length} />
        {discoverList.length > 0 ? (
          discoverList.map((friend) => <DiscoverCard key={friend.id} friend={friend} />)
        ) : (
          <EmptyState icon="sparkles-outline" title="No people found" body="Try another name, netid, or email." />
        )}

        {outgoingRequests.length > 0 && (
          <>
            <SectionHeader title="Sent Requests" count={outgoingRequests.length} />
            {outgoingRequests.map((request) => (
              <View key={request.id} style={styles.discoverCard}>
                <View style={styles.personRow}>
                  <FriendAvatar friend={request.receiver} />
                  <PersonMeta friend={request.receiver} />
                </View>
                <TouchableOpacity
                  style={[styles.smallButton, styles.ghostButton]}
                  disabled={busyId === request.id}
                  onPress={() => runAction(request.id, () => friendsAPI.cancelRequest(request.id))}
                >
                  <Text style={styles.ghostButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal transparent visible={Boolean(selectedFriend)} animationType="fade" onRequestClose={() => setSelectedFriend(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedFriend(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
            {selectedFriend && (
              <>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <FriendAvatar friend={selectedFriend} size={78} />
                  <View style={styles.sheetTitleWrap}>
                    <Text style={styles.sheetName}>{selectedFriend.name}</Text>
                    <Text style={styles.sheetNetid}>@{selectedFriend.netid}</Text>
                  </View>
                </View>
                <Text style={styles.sheetBio}>{selectedFriend.bio || 'No bio yet, but the mystery is part of the charm.'}</Text>
                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={[styles.sheetButton, styles.messageButton]}
                    onPress={() => viewFriendProfile(selectedFriend)}
                  >
                    <Ionicons name="person-circle-outline" size={18} color="#fff" />
                    <Text style={styles.sheetButtonText}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sheetButton, styles.removeButton]}
                    onPress={() => {
                      const friendId = selectedFriend.id;
                      setSelectedFriend(null);
                      runAction(friendId, () => friendsAPI.removeFriend(friendId));
                    }}
                  >
                    <Ionicons name="person-remove-outline" size={18} color={theme.danger} />
                    <Text style={styles.removeButtonText}>Unfriend</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: 18, paddingBottom: 44 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
  loadingText: { marginTop: 12, color: theme.textSecondary, fontSize: 14 },
  hero: {
    backgroundColor: theme.primary,
    borderRadius: 28,
    padding: 22,
    minHeight: 170,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  eyebrow: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 42, fontWeight: '900', marginTop: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.86)', maxWidth: 250, marginTop: 8, lineHeight: 20 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 24, padding: 14, alignItems: 'center', minWidth: 86 },
  heroBadgeNumber: { color: '#fff', fontSize: 28, fontWeight: '900' },
  heroBadgeLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  searchCard: {
    marginTop: -18,
    marginHorizontal: 10,
    backgroundColor: theme.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'web' ? 12 : 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: { flex: 1, padding: 12, color: theme.text, fontSize: 16, outlineStyle: 'none' as any },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 10 },
  sectionTitle: { color: theme.text, fontSize: 20, fontWeight: '800' },
  countPill: { marginLeft: 10, backgroundColor: theme.primary, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  friendCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  requestCard: { backgroundColor: theme.card, borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  discoverCard: {
    backgroundColor: theme.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.border,
  },
  personRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { backgroundColor: theme.border, marginRight: 12 },
  personTextWrap: { flex: 1, minWidth: 0 },
  personName: { color: theme.text, fontSize: 16, fontWeight: '800' },
  personSubtext: { color: theme.textSecondary, fontSize: 13, marginTop: 2 },
  personMajor: { color: theme.primary, fontSize: 12, fontWeight: '700', marginTop: 3 },
  requestButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  smallButton: { borderRadius: 999, paddingHorizontal: 15, paddingVertical: 9, marginLeft: 8 },
  primaryButton: { backgroundColor: theme.primary },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  ghostButton: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  ghostButtonText: { color: theme.text, fontSize: 13, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  statusText: { color: theme.text, fontSize: 12, fontWeight: '800', marginLeft: 4 },
  emptyState: { backgroundColor: theme.card, borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginTop: 8 },
  emptyBody: { color: theme.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: theme.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, borderWidth: 1, borderColor: theme.border },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 999, backgroundColor: theme.border, marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center' },
  sheetTitleWrap: { flex: 1 },
  sheetName: { color: theme.text, fontSize: 24, fontWeight: '900' },
  sheetNetid: { color: theme.textSecondary, fontSize: 15, marginTop: 2 },
  sheetBio: { color: theme.textSecondary, lineHeight: 21, marginTop: 16 },
  sheetActions: { flexDirection: 'row', marginTop: 20 },
  sheetButton: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  messageButton: { backgroundColor: theme.primary, marginRight: 10 },
  removeButton: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  sheetButtonText: { color: '#fff', fontWeight: '900', marginLeft: 7 },
  removeButtonText: { color: theme.danger, fontWeight: '900', marginLeft: 7 },
});
