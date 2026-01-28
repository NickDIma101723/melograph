import styles from './artists.module.scss';

export default function Loading() {
  return (
    <div className={styles.page} style={{ background: '#000', width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Background Overlay */}
        <div className={styles.gridLines} />
        <div className={styles.noiseOverlay} />
    </div>
  )
}