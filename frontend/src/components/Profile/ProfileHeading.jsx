// Tab title: "My <accent>" with the italic serif accent word, plus an optional action on the right
const ProfileHeading = ({ before = "My", accent, description, action }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div className="min-w-0">
      <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[32px]">
        {before} <span className="font-accent font-medium italic text-[#d6008a]">{accent}</span>
      </h1>
      {description && <p className="mt-1 text-[13.5px] text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);

export default ProfileHeading;
