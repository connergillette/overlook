export default function DonationCTA() {
  return (
    <div className="flex justify-center py-10 text-sm max-w-[80%] self-center">
      <div className="bg-white/10 max-w-[400px] rounded-2xl p-4 flex flex-col gap-2">
        <h2 className="font-bold">Enjoying Overlook?</h2>
        <p><span className="text-theme-yellow">This site will never have ads.</span> If you find this tool useful, please consider donating to support its development.</p>
        <a href="https://paypal.me/cwgillette" target="_blank" rel="noreferrer" className="text-theme-yellow hover:opacity-70 text-center transition-colors flex justify-center">
          <div className="rounded-lg overflow-hidden bg-theme-yellow/10 p-2 grow">
            Donate
          </div>
        </a>
      </div>
    </div>
  )
}