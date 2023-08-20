import { createContext, ReactNode, useEffect, useReducer } from 'react';

import axios from 'axios';

type ProductType = {
  imageUrl: string;
  name: string;
  price: string;
  id: string;
  description?: string;
  defaultPriceId?: string;
  quantity?: number;
};

interface PurchaseContextProps {
  cart: ProductType[];
  total: number;
  addToCart: (product: ProductType) => void;
  removeFromCart: (id: string) => void;
  buyProduct: () => void;
}

interface PurchaseContextProviderProps {
  children: ReactNode;
}

export const PurchaseContext = createContext({} as PurchaseContextProps);

export const PurchaseProvider = ({
  children,
}: PurchaseContextProviderProps) => {
  const [purchaseState, dispatch] = useReducer(
    (state: any, action: any) => {
      switch (action.type) {
        case 'SET_RECOVERED_VALUE': {
          return action.payload.cart;
        }

        case 'ADD_TO_CART': {
          const { cart } = state;

          const newCart = [...cart, action.payload.product];

          const newTotal = newCart.reduce((total, product) => {
            const productPrice =
              parseInt(product.price.replace(/\D/g, '')) / 100;

            const productTotal = productPrice * (product.quantity || 1);
            return total + productTotal;
          }, 0);

          return {
            cart: newCart,
            total: newTotal,
          };
        }

        case 'REMOVE_FROM_CART': {
          const { cart } = state;

          const newCart = cart.filter((product: ProductType) => {
            return product.id !== action.payload.id;
          });
          const newTotal = newCart.reduce(
            (total, product) => total + parseInt(product.price) / 100,
            0,
          );

          return {
            cart: newCart,
            total: newTotal,
          };
        }

        default:
          return state;
      }
    },
    {
      cart: [],
      total: 0,
    },
  );

  useEffect(() => {
    const storedStateAsJSON = localStorage.getItem('@ignite-shop/purchase');

    if (storedStateAsJSON) {
      dispatch({
        type: 'SET_RECOVERED_VALUE',
        payload: {
          cart: JSON.parse(storedStateAsJSON),
        },
      });
    }
  }, []);

  useEffect(() => {
    const stateJSON = JSON.stringify(purchaseState);

    localStorage.setItem('@ignite-shop/purchase', stateJSON);
  }, [purchaseState]);

  const { cart, total } = purchaseState;

  const addToCart = (product: ProductType) => {
    const { id } = product;

    const productInCart = cart.filter((product: ProductType) => {
      return product.id === id;
    });

    if (productInCart.length > 0) {
      return;
    }
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        product,
      },
    });
  };

  const removeFromCart = (id: string) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: {
        id,
      },
    });
  };

  const buyProduct = async () => {
    const pricesId = cart.map((product: ProductType) => {
      return {
        price: product.defaultPriceId,
        quantity: product.quantity,
      };
    });

    try {
      const resp = await axios.post('/api/checkout', {
        pricesId,
      });
      const { checkoutUrl } = resp.data;
      window.location.href = checkoutUrl;
    } catch (error) {
      alert(error.error);
    }
  };

  return (
    <PurchaseContext.Provider
      value={{ cart, addToCart, removeFromCart, buyProduct, total }}
    >
      {children}
    </PurchaseContext.Provider>
  );
};
