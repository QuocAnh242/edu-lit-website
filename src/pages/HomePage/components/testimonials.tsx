export function Testimonials() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2
          className="text-center text-3xl font-extrabold text-gray-900"
          style={{ fontFamily: 'LatoBlack, sans-serif' }}
        >
          What People Say
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              quote:
                'EduLit streamlined my grading with clear rubrics and AI suggestions—huge time saver.',
              name: 'Ms. Nguyen, Teacher'
            },
            {
              quote:
                'I love the course structure and feedback—my essays improved a lot this term.',
              name: 'Bao, Student'
            },
            {
              quote:
                'The plagiarism check keeps our submissions honest and original.',
              name: 'Lan, Student'
            }
          ].map((t, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-cyan-200 bg-white p-6 shadow-sm"
            >
              <p className="text-gray-700">“{t.quote}”</p>
              <p className="mt-4 text-sm font-semibold text-cyan-700">
                {t.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
