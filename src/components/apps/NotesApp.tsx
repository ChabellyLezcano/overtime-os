'use client';

const NotesApp: React.FC = () => {
  return (
    <div className="md:text-md h-full w-full space-y-3 p-4 text-xs text-slate-100">
      <h2 className="text-md font-semibold text-amber-300">
        Release Notes – OvertimeOS v1.0
      </h2>

      <p className="text-slate-300">
        Dear <span className="font-mono">overworked_dev</span>,
      </p>

      <p className="text-slate-300">
        This build ships with a &quot;harmless&quot; background daemon that keeps your
        system alive after 17:00, just in case you felt like working more &quot;for
        fun&quot;.
      </p>

      <ul className="list-inside list-disc space-y-1 text-slate-300">
        <li>Prevents shutdown when there are &quot;pending tasks&quot;.</li>
        <li>Randomly opens apps to make you &quot;just check one more thing&quot;.</li>
        <li>Feeds on unpaid overtime and cold coffee.</li>
      </ul>

      <div className="mt-2 space-y-1 rounded-xl border border-amber-400/70 bg-slate-900/70 p-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-amber-300 uppercase">
          Hidden dev note
        </p>
        <p className="md:text-md text-xs text-slate-100">
          First fragment of the kill code:
          <span className="font-mono text-amber-300"> KILL-OVERTIME-NOTES</span>
        </p>
      </div>
    </div>
  );
};

export default NotesApp;
