import { addDays, addMonths } from '../../domain/product/dates';
import { workspace } from '../local/runtime';
import { useProduct, entities, run } from '../product/state';
import { Panel } from '../product/Common';
export function PetRhythm() {
  const { profile } = useProduct();
  const care = entities('pet');
  const choices = [
    {
      category: 'Vet' as const,
      date: profile.petNextVet,
      interval: `Every ${profile.petVetMonths ?? 12} months`,
      next: (date: string) => addMonths(date, profile.petVetMonths ?? 12),
    },
    {
      category: 'Food' as const,
      date: profile.petNextFood,
      interval: `Every ${profile.petFoodDays ?? 30} days`,
      next: (date: string) => addDays(date, profile.petFoodDays ?? 30),
    },
  ];
  return (
    <Panel title="Your care rhythm">
      {choices.map(({ category, date, interval, next }) => {
        const matching = care
          .filter(
            (r) =>
              r.data.category === category &&
              r.data.notes === 'From your survey care rhythm.',
          )
          .sort((a, b) => b.data.date.localeCompare(a.data.date));
        const last = matching[0];
        const due = last?.data.completed ? next(last.data.date) : date;
        const pending = matching.some((r) => !r.data.completed);
        return (
          <div key={category}>
            <h3>
              {category} · {interval}
            </h3>
            <p>
              {pending
                ? 'A care reminder is already in your timeline.'
                : due
                  ? `Next date: ${due}`
                  : 'Set the next date in Preferences to start this rhythm.'}
            </p>
            <button
              type="button"
              disabled={!due || pending}
              onClick={() => {
                if (due)
                  run(
                    workspace.save(
                      workspace.make(
                        `${profile.petName || 'Pet'} ${category.toLowerCase()} reminder`,
                        {
                          type: 'pet',
                          category,
                          date: due,
                          notes: 'From your survey care rhythm.',
                          completed: false,
                        },
                      ),
                    ),
                  );
              }}
            >
              Add next {category.toLowerCase()} reminder
            </button>
          </div>
        );
      })}
    </Panel>
  );
}
