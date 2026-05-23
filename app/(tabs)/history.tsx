import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Image, ImageBackground, Pressable, SafeAreaView, StatusBar, Platform, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { getScanHistory, clearScanHistory, deleteScanHistoryEntry, type ScanHistoryEntry } from '@/services/scan-history';
import { getConditionInfo } from '@/data/diagnosis';
import { GlassView } from '@/components/nailscan/glass-view';

export default function HistoryScreen() {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<ScanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const items = await getScanHistory();
      setHistoryItems(items);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    if (historyItems.length === 0) return;
    
    Alert.alert(
      "Delete all history?",
      "This will permanently remove all saved scan results.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await clearScanHistory();
            setHistoryItems([]);
          }
        }
      ]
    );
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert(
      "Delete Scan",
      "Are you sure you want to delete this scan?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await deleteScanHistoryEntry(id);
            setHistoryItems(items => items.filter(item => item.id !== id));
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <Pressable 
          style={styles.headerIconBtn}
          onPress={() => router.push('/(tabs)')}
        >
          <Ionicons name="chevron-back" size={24} color="#0B2E6F" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Scan History</Text>
        <Pressable 
          style={styles.headerIconBtn}
          onPress={historyItems.length > 0 ? handleClearHistory : undefined}
          disabled={historyItems.length === 0}
        >
          <Ionicons name="trash-outline" size={20} color={historyItems.length > 0 ? "#EF4444" : "#B8C7E0"} />
        </Pressable>
      </View>
      <Text style={styles.headerSubtitle}>View your past nail scan results</Text>
    </View>
  );

  const renderAutoSaveCard = () => (
    <GlassView 
      style={styles.autoSaveCard}
      intensity={80}
      borderRadius={24}
      backgroundColor="rgba(255,255,255,0.4)"
      borderColor="rgba(255,255,255,0.8)"
      borderWidth={1.5}
    >
      <View style={styles.autoSaveIconWrapper}>
        <Ionicons name="shield-checkmark" size={26} color="white" />
      </View>
      <View style={styles.autoSaveTextWrapper}>
        <Text style={styles.autoSaveTitle}>Results are automatically saved</Text>
        <Text style={styles.autoSaveDesc}>All your scan results are securely stored and can be viewed anytime.</Text>
      </View>
    </GlassView>
  );

  const renderRecentTitle = () => (
    <View style={styles.recentTitleWrapper}>
      <Text style={styles.recentTitle}>Recent Scans</Text>
      <Text style={styles.recentCount}>{historyItems.length} result{historyItems.length === 1 ? '' : 's'}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: ScanHistoryEntry }) => {
    const diagnosis = getConditionInfo(item.label);
    const dateStr = format(new Date(item.timestamp), 'MMM d, yyyy HH:mm');
    
    return (
      <Pressable onPress={() => router.push(`/history/${item.id}`)} onLongPress={() => handleDeleteItem(item.id)}>
        <GlassView 
          style={styles.historyCard}
          intensity={80}
          borderRadius={24}
          backgroundColor="rgba(255,255,255,0.4)"
          borderColor="rgba(255,255,255,0.8)"
          borderWidth={1.5}
        >
          <View style={styles.cardImageWrapper}>
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
            ) : (
              <Ionicons name="image-outline" size={34} color="#006DFF" />
            )}
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.cardCondition} numberOfLines={1}>
              {diagnosis.label.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            
            <View style={styles.infoLine}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#006DFF" />
              <Text style={[styles.infoText, { color: '#006DFF' }]}>{(item.confidence * 100).toFixed(0)}% Confidence</Text>
            </View>

            <View style={styles.infoLine}>
              <Ionicons name="calendar-outline" size={16} color="#64789A" />
              <Text style={[styles.infoText, { color: '#64789A' }]}>{dateStr}</Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#006DFF" />
        </GlassView>
      </Pressable>
    );
  };

  const renderEmptyContent = () => (
    <View style={styles.emptyContent}>
      <GlassView 
        style={styles.emptyCard}
        intensity={80}
        borderRadius={24}
        backgroundColor="rgba(255,255,255,0.4)"
        borderColor="rgba(255,255,255,0.8)"
        borderWidth={1.5}
      >
        <View style={styles.emptyIconCircle}>
          <Ionicons name="time" size={46} color="#006DFF" />
        </View>
        <Text style={styles.emptyTitle}>No History Yet</Text>
        <Text style={styles.emptyDesc}>Your scan results will appear here after your first analysis.</Text>
      </GlassView>
    </View>
  );

  return (
    <ImageBackground 
      source={require('@/assets/images/background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            {renderHeader()}
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : historyItems.length === 0 ? (
          <View style={{ flex: 1 }}>
            {renderHeader()}
            {renderEmptyContent()}
          </View>
        ) : (
          <FlatList
            data={historyItems}
            keyExtractor={item => item.id}
            ListHeaderComponent={() => (
              <>
                {renderHeader()}
                {renderAutoSaveCard()}
                {renderRecentTitle()}
              </>
            )}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B2E6F" />
            }
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#071F55',
    marginHorizontal: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F5F8F',
    marginLeft: 56,
  },
  autoSaveCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  autoSaveIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#006DFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  autoSaveTextWrapper: {
    flex: 1,
  },
  autoSaveTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#006DFF',
    marginBottom: 4,
  },
  autoSaveDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#071F55',
  },
  recentTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  recentTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    color: '#071F55',
  },
  recentCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006DFF',
  },
  listContent: {
    paddingBottom: 40,
  },
  historyCard: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  cardImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#E9F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
  },
  cardCondition: {
    fontSize: 17,
    fontWeight: '900',
    color: '#071F55',
    marginBottom: 6,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  riskPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  riskPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 88,
  },
  emptyCard: {
    padding: 26,
    alignItems: 'center',
    width: '100%',
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,109,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20, // Wait, margin bottom 20
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#071F55',
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 19.6,
    fontWeight: '700',
    color: '#4F668F',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontWeight: '600',
    color: '#4667A0',
  },
});
