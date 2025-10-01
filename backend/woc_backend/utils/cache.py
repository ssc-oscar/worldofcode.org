import collections
import pickle
import time
from abc import ABC, abstractmethod
from typing import Any, Callable, Generic, Iterator, List, Optional, TypeVar

import redis
from redis.typing import KeyT

K = TypeVar("K", bound=KeyT)
V = TypeVar("V")


class AbstractCache(Generic[K, V], ABC):
    @abstractmethod
    def get(self, key: K) -> Optional[V]:
        pass

    @abstractmethod
    def put(self, key: K, value: V, ttl: Optional[int] = None) -> None:
        pass

    @abstractmethod
    def delete(self, key: K) -> bool:
        pass

    @abstractmethod
    def clear(self) -> None:
        pass

    @abstractmethod
    def __len__(self) -> int:
        pass

    @abstractmethod
    def __contains__(self, key: K) -> bool:
        pass


class MemoryCache(AbstractCache[K, V]):
    """Thread-safe cache with time-based expiration using OrderedDict for LRU functionality."""

    def __init__(self, max_size: int = 1000, ttl_seconds: int = 60):
        """
        Initialize the cache.

        Args:
            max_size: Maximum number of items in the cache
            ttl_seconds: Default time-to-live for cache entries in seconds
        """
        self._cache: collections.OrderedDict[K, tuple[V, int]] = (
            collections.OrderedDict()
        )
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds

    def get(self, key: K) -> Optional[V]:
        """Get a value from cache if it exists and isn't expired."""
        if key in self._cache:
            value, expiry = self._cache[key]
            if time.time() < expiry:
                # Move the item to end to mark it as most recently used
                self._cache.move_to_end(key)
                return value

            # Remove expired entry
            self._cache.pop(key)
        return None

    def put(self, key: K, value: V, ttl: Optional[int] = None) -> None:
        """Set a value in the cache with expiration."""
        ttl = ttl if ttl is not None else self.ttl_seconds
        expiry = int(time.time() + ttl)

        # If key exists, update it (and move to end)
        if key in self._cache:
            self._cache.pop(key)

        # Check if we need to evict items
        elif len(self._cache) >= self.max_size:
            # OrderedDict makes this efficient - removes oldest item
            self._cache.popitem(last=False)

        # Add the new entry (automatically at the end/most-recent position)
        self._cache[key] = (value, expiry)

    def delete(self, key: K) -> bool:
        """Remove a key from the cache."""
        if key in self._cache:
            self._cache.pop(key)
            return True
        return False

    def clear(self) -> None:
        """Clear the entire cache."""
        self._cache.clear()

    def __len__(self) -> int:
        """Return the number of items in the cache."""
        return len(self._cache)

    def __contains__(self, key: K) -> bool:
        """Check if a key is in the cache and not expired."""
        if key in self._cache:
            _, expiry = self._cache[key]
            return time.time() < expiry
        return False


class RedisCache(AbstractCache[K, V]):
    """Redis-backed cache using Redis databases for isolation."""

    def __init__(self, url: str, ttl_seconds: int):
        self._client = redis.from_url(  # type: ignore[attr-defined]
            url, decode_responses=False
        )
        self._ttl_seconds = ttl_seconds

    def _iter_namespace_keys(self, batch_size: int = 512) -> Iterator[bytes]:
        """Yield keys in the current Redis database incrementally."""
        yield from self._client.scan_iter(count=batch_size)

    def get(self, key: K) -> Optional[V]:
        payload = self._client.get(key)
        if payload is None:
            return None
        return pickle.loads(payload)

    def put(self, key: K, value: V, ttl: Optional[int] = None) -> None:
        expiration = ttl if ttl is not None else self._ttl_seconds
        payload = pickle.dumps(value, protocol=pickle.HIGHEST_PROTOCOL)
        self._client.set(key, payload, ex=expiration)

    def delete(self, key: K) -> bool:
        return self._client.delete(key) == 1

    def clear(self) -> None:
        deleter: Callable[..., Any]
        unlink = getattr(self._client, "unlink", None)
        deleter = unlink if callable(unlink) else self._client.delete

        batch: List[bytes] = []
        for namespaced_key in self._iter_namespace_keys():
            batch.append(namespaced_key)
            if len(batch) >= 1024:
                deleter(*batch)
                batch.clear()

        if batch:
            deleter(*batch)

    def __len__(self) -> int:
        return int(self._client.dbsize())

    def __contains__(self, key: K) -> bool:
        return bool(self._client.exists(key))
