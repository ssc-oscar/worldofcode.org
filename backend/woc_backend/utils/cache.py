import time
import collections
from typing import Dict, Optional, Tuple, Generic, TypeVar

K = TypeVar('K')
V = TypeVar('V')

class TTLCache(Generic[K, V]):
    """Thread-safe cache with time-based expiration using OrderedDict for LRU functionality."""
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 60):
        """
        Initialize the cache.
        
        Args:
            max_size: Maximum number of items in the cache
            ttl_seconds: Default time-to-live for cache entries in seconds
        """
        self._cache: Dict[K, Tuple[V, float]] = collections.OrderedDict()
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
    
    def set(self, key: K, value: V, ttl: Optional[int] = None) -> None:
        """Set a value in the cache with expiration."""
        ttl = ttl if ttl is not None else self.ttl_seconds
        expiry = time.time() + ttl
        
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