import { searchUsers } from '@/api/user';
import BackButton from '@/components/BackButton';
import SearchUserItem from '@/components/SearchUserItem';
import Colors from '@/constants/Colors';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Search() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Fetch search results
  const { data: users = [], isLoading: isSearching } = useQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.searchRow}>
          <BackButton />
          <TextInput
            style={styles.searchInput}
            placeholderTextColor={Colors.textSecondary}
            placeholder="Search users..."
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {isSearching ? (
          <Text style={styles.loadingText}>Searching...</Text>
        ) : (
          <FlatList
            data={users}
            renderItem={(user) => <SearchUserItem user={user.item} />}
            keyExtractor={(item) => item.username}
            ListEmptyComponent={
              debouncedQuery ? (
                <Text style={styles.emptyText}>No users found</Text>
              ) : (
                <Text style={styles.emptyText}>Start typing to search for users</Text>
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
  },
  loadingText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 20,
  },
});
