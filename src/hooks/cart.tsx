import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem('@GoMarketplace');

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts([]);
      }
    }
    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const foundProduct = products.find(each => each.id === product.id);

      let state;
      if (!foundProduct) {
        state = [
          ...products,
          {
            ...product,
            quantity: 1,
          },
        ];
      } else {
        state = products.map(prod => {
          if (prod.id === product.id) {
            return {
              ...prod,
              quantity: prod.quantity + 1,
            };
          }
          return prod;
        });
      }

      setProducts(state);
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(state));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const state = products.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }
        return product;
      });

      setProducts(state);

      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const found = products.find(product => product.id === id);
      let state: Product[] = [];
      if (found && found.quantity > 1) {
        state = products.map(product => {
          if (product.id === id) {
            return {
              ...product,
              quantity: product.quantity - 1,
            };
          }
          return product;
        });
      } else if (found && found.quantity === 1) {
        state = products.filter(product => product.id !== id);
      }
      setProducts(state);
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(state));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
