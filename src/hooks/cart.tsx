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
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storageProducts) {
        setProducts([...JSON.parse(storageProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(productCart =>
        productCart.id === id
          ? { ...productCart, quantity: productCart.quantity + 1 }
          : productCart,
      );

      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const existentProduct = products.find(
        productCart => productCart.id === product.id,
      );

      if (existentProduct) {
        increment(existentProduct.id);
        return;
      }
      setProducts([...products, { ...product, quantity: 1 }]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify([...products, { ...product, quantity: 1 }]),
      );
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const findProduct = products.find(cartProduct => cartProduct.id === id);

      if (findProduct && findProduct.quantity <= 1) {
        const filteredProducst = products.filter(
          cartProduct => cartProduct.id !== id,
        );
        setProducts(filteredProducst);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(filteredProducst),
        );
        return;
      }

      const newProducts = products.map(productCart =>
        productCart.id === id
          ? { ...productCart, quantity: productCart.quantity - 1 }
          : productCart,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
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
