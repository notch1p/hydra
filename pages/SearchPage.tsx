import { Feather } from "@expo/vector-icons";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import {
  SearchResult,
  SearchType,
  SearchTypes,
  getSearchResults,
} from "../api/Search";
import { Subreddit, getTrending } from "../api/Subreddits";
import PostComponent from "../components/RedditDataRepresentations/Post/PostComponent";
import SubredditComponent from "../components/RedditDataRepresentations/Subreddit/SubredditComponent";
import UserComponent from "../components/RedditDataRepresentations/User/UserComponent";
import List from "../components/UI/List";
import RedditDataScroller from "../components/UI/RedditDataScroller";
import SearchBar from "../components/UI/SearchBar";
import { ThemeContext } from "../contexts/SettingsContexts/ThemeContext";
import { useURLNavigation } from "../utils/navigation";
import useRedditDataState from "../utils/useRedditDataState";

export default function SearchPage() {
  const { theme } = useContext(ThemeContext);
  const { pushURL } = useURLNavigation();

  const [trending, setTrending] = useState<Subreddit[]>([]);
  const search = useRef<string>("");
  const [searchType, setSearchType] = useState<SearchType>("posts");
  const [loading, setLoading] = useState(false);

  const {
    data: searchResults,
    loadMoreData: loadMoreSearchResults,
    refreshData: refreshSearchResults,
    modifyData: modifySearchResults,
    deleteData: deleteSearchResults,
    fullyLoaded,
    hitFilterLimit,
  } = useRedditDataState<SearchResult>({
    loadData: async (after) => {
      if (!search.current) {
        if (searchResults.length) {
          deleteSearchResults();
        }
        return [];
      }
      if (after && searchType === "users") {
        // API only allows 1 page of search for users
        return [];
      }
      setLoading(true);
      const newResults = await getSearchResults(searchType, search.current, {
        after,
      });
      setLoading(false);
      return newResults;
    },
  });

  const loadTrending = async () => {
    const newTrending = await getTrending();
    setTrending(
      newTrending.filter((sub) => !sub.subscribed && sub.name !== "Home"),
    );
  };

  useEffect(() => {
    loadTrending();
  }, []);

  useEffect(() => {
    refreshSearchResults();
  }, [searchType]);

  return (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.searchOptionsContainer}>
        {SearchTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.searchOption,
              {
                backgroundColor:
                  searchType === type ? theme.tint : "transparent",
              },
            ]}
            activeOpacity={0.8}
            onPress={() => setSearchType(type)}
          >
            <Text
              key={type}
              style={[
                styles.searchOptionText,
                {
                  color: theme.text,
                },
              ]}
            >
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <SearchBar
        onSearch={(text) => {
          search.current = text;
          refreshSearchResults();
        }}
      />
      <RedditDataScroller<SearchResult>
        loadMore={loadMoreSearchResults}
        refresh={refreshSearchResults}
        fullyLoaded={fullyLoaded}
        hitFilterLimit={hitFilterLimit}
        data={searchResults}
        renderItem={({ item }) => {
          if (item.type === "post")
            return (
              <PostComponent
                post={item}
                setPost={(newPost) => modifySearchResults([newPost])}
              />
            );
          if (item.type === "subreddit")
            return <SubredditComponent subreddit={item} />;
          if (item.type === "user") return <UserComponent user={item} />;
          return null;
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={theme.text} />
            </View>
          ) : (
            <List
              title="Trending Subreddits"
              items={trending.map((sub) => ({
                key: sub.id,
                icon: (
                  <Feather
                    name="trending-up"
                    size={22}
                    color={theme.iconPrimary}
                  />
                ),
                text: sub.name,
                onPress: () => pushURL(sub.url),
              }))}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
  },
  searchOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    marginBottom: 5,
  },
  searchOption: {
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  searchOptionText: {},
  searchBarContainer: {
    marginVertical: 10,
    marginHorizontal: 5,
    padding: 7,
    paddingLeft: 10,
    borderRadius: 10,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  searchBarIcon: {
    marginRight: 5,
  },
  searchBar: {
    flex: 1,
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  loaderContainer: {
    marginTop: 20,
  },
  trendingContainer: {
    flex: 1,
    marginHorizontal: 5,
    paddingHorizontal: 5,
    borderRadius: 10,
  },
});
