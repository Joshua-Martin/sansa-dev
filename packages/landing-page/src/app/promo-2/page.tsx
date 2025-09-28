export default function PromoPage() {
  const messageBubbles = [
    {
      text: 'Thanks',
      size: 'w-56',
      position: 'top-16 left-48',
      zIndex: 'z-130',
    },
    { text: '', size: 'w-56', position: 'top-28 right-60', zIndex: 'z-10' },
    {
      text: 'when do you open?',
      size: 'w-56',
      position: 'top-36 left-72',
      zIndex: 'z-140',
    },
    { text: '', size: 'w-56', position: 'top-44 right-54', zIndex: 'z-20' },
    {
      text: 'thanks for the summary',
      size: 'w-56',
      position: 'top-52 left-36',
      zIndex: 'z-150',
    },
    { text: '', size: 'w-56', position: 'top-60 right-78', zIndex: 'z-30' },
    {
      text: 'Got it!',
      size: 'w-56',
      position: 'top-68 left-84',
      zIndex: 'z-160',
    },
    {
      text: '',
      size: 'w-56',
      position: 'top-[20rem] right-42',
      zIndex: 'z-40',
    },
    { text: '', size: 'w-56', position: 'top-[22rem] left-60', zIndex: 'z-50' },
    {
      text: 'Perfect',
      size: 'w-56',
      position: 'top-[24rem] right-72',
      zIndex: 'z-170',
    },
    { text: '', size: 'w-56', position: 'top-[26rem] left-48', zIndex: 'z-60' },
    {
      text: '',
      size: 'w-56',
      position: 'top-[28rem] right-54',
      zIndex: 'z-70',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-black">
      <div className="relative w-full max-w-md h-[600px]">
        {messageBubbles.map((bubble, index) => (
          <div
            key={index}
            className={`absolute ${bubble.position} ${bubble.zIndex} ${bubble.size}`}
          >
            {bubble.text && (
              <div className="text-xs text-gray-100 mb-1 max-w-xs text-right">
                user
              </div>
            )}
            <div className="p-3 border border-gray-100 text-gray-100 rounded-l-lg rounded-t-lg bg-black/05 backdrop-blur-sm">
              {bubble.text || (
                <span className="text-[#00000000]">placeholder</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
