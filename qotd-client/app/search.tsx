import { searchUsers } from '@/api/user';
import SearchUserItem from '@/components/SearchUserItem';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

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
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholderTextColor="#ddd"
        placeholder="Search users..."
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});
