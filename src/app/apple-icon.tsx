import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          borderRadius: '24px', 
        }}
      >
        <div
          style={{
            width: '32px',
            height: '110px',
            background: 'white',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
