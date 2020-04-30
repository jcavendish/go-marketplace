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
      const foundIndex = products.findIndex(each => each.id === product.id);

      let state;
      if (foundIndex < 0) {
        state = [
          ...products,
          {
            id: product.id,
            title: product.title,
            image_url: product.image_url,
            price: product.price,
            quantity: 1,
          },
        ];
      } else {
        const newProduct = {
          ...products[foundIndex],
          quantity: products[foundIndex].quantity + 1,
        };
        state = [
          ...products.slice(0, foundIndex),
          newProduct,
          ...products.slice(foundIndex + 1),
        ];
      }

      setProducts(state);
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(state));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const foundIndex = products.findIndex(product => product.id === id);
      const newProduct = {
        ...products[foundIndex],
        quantity: products[foundIndex].quantity + 1,
      };
      const state = [
        ...products.slice(0, foundIndex),
        newProduct,
        ...products.slice(foundIndex + 1),
      ];
      setProducts(state);

      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(state));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const foundIndex = products.findIndex(product => product.id === id);
      let state: Product[] = [];
      if (products[foundIndex] && products[foundIndex].quantity > 1) {
        const newProduct = {
          ...products[foundIndex],
          quantity: products[foundIndex].quantity - 1,
        };
        state = [
          ...products.slice(0, foundIndex),
          newProduct,
          ...products.slice(foundIndex + 1),
        ];
      } else if (products[foundIndex] && products[foundIndex].quantity === 1) {
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
