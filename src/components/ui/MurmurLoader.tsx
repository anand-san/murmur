export default function MurmurLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <img
        src="/logo.png"
        className="h-12 w-12 text-primary group-data-[collapsible=icon]:h-7"
      />
      <div className="text-gray-500">Loading</div>
    </div>
  );
}
