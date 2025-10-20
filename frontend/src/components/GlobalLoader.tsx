"use client";

import { useLoader } from '@/context/LoaderContext';
import styles from './GlobalLoader.module.css';

const GlobalLoader = () => {
  const { isLoading } = useLoader();

  if (!isLoading) {
    return null;
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.spinner}></div>
    </div>
  );
};

export default GlobalLoader;