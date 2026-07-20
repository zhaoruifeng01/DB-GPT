interface MetricBar {
  name: string;
  label: string;
  value: number;
}

export function MetricBars({ data }: { data: MetricBar[] }) {
  const labels = Array.from(new Set(data.map(item => item.label)));

  return (
    <div className='space-y-4'>
      {labels.map(label => {
        const items = data.filter(item => item.label === label);
        return (
          <div key={label} className='rounded border border-gray-100 p-4 dark:border-gray-700'>
            <div className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-200'>{label}</div>
            <div className='space-y-3'>
              {items.map(item => {
                const width = `${Math.max(0, Math.min(100, item.value * 100))}%`;
                return (
                  <div key={`${item.label}-${item.name}`} className='grid grid-cols-[140px_1fr_64px] items-center gap-3'>
                    <span className='truncate text-sm text-gray-500 dark:text-gray-300'>{item.name}</span>
                    <div className='h-3 rounded bg-gray-100 dark:bg-gray-800'>
                      <div className='h-3 rounded bg-[#2867f5]' style={{ width }} />
                    </div>
                    <span className='text-right text-sm text-gray-500 dark:text-gray-300'>
                      {(item.value * 100).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
