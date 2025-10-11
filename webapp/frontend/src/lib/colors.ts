// Generate consistent pastel colors for roles and tags
export function getColorForText(text: string): string {
  // Hash the text to get a consistent number
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Pastel color palette - soft, gentle colors
  const pastelColors = [
    'bg-pink-100 text-pink-800 border-pink-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
    'bg-blue-100 text-blue-800 border-blue-300',
    'bg-cyan-100 text-cyan-800 border-cyan-300',
    'bg-teal-100 text-teal-800 border-teal-300',
    'bg-green-100 text-green-800 border-green-300',
    'bg-lime-100 text-lime-800 border-lime-300',
    'bg-yellow-100 text-yellow-800 border-yellow-300',
    'bg-orange-100 text-orange-800 border-orange-300',
    'bg-rose-100 text-rose-800 border-rose-300',
    'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
    'bg-violet-100 text-violet-800 border-violet-300',
    'bg-sky-100 text-sky-800 border-sky-300',
    'bg-emerald-100 text-emerald-800 border-emerald-300',
    'bg-amber-100 text-amber-800 border-amber-300',
  ];

  // Use hash to pick a color consistently
  const index = Math.abs(hash) % pastelColors.length;
  return pastelColors[index];
}
