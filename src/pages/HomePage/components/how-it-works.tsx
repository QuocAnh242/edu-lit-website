export function HowItWorks() {
  return (
    <section className="border-y border-cyan-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2
          className="text-center text-3xl font-extrabold text-gray-900"
          style={{ fontFamily: 'LatoBlack, sans-serif' }}
        >
          How EduLit Works
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            {
              step: '1',
              title: 'Create or Discover',
              desc: 'Teachers publish lessons and courses; students find what fits.'
            },
            {
              step: '2',
              title: 'Enroll & Learn',
              desc: 'Join classes, access readings, and complete assignments.'
            },
            {
              step: '3',
              title: 'Submit & Get Feedback',
              desc: 'Upload essays and receive timely feedback with AI assistance.'
            },
            {
              step: '4',
              title: 'Grow Your Skills',
              desc: 'Track progress, improve writing, and master literature.'
            }
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-cyan-200 bg-white p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-white">
                <span className="text-sm font-bold">{item.step}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {item.title}
              </h3>
              <p className="mt-2 text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
