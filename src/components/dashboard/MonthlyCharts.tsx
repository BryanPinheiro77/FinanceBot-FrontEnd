import type { MonthlySummary } from '@/lib/dashboard-api'
import { formatCurrency, monthLabel } from '@/lib/dashboard-api'

export function MonthlyCharts({ summary }: { summary: MonthlySummary }) {
  const maximum = Math.max(
    1,
    ...summary.daily.flatMap((day) => [day.totalIncome, day.totalExpense]),
  )
  const categoryMaximum = Math.max(
    1,
    ...summary.expensesByCategory.map((category) => category.totalExpense),
  )

  return (
    <div className="dashboard-charts">
      <section className="dashboard-panel" aria-labelledby="daily-title">
        <h2 id="daily-title">Movimentação do mês</h2>
        <p className="dashboard-description">
          Receitas e despesas por data de lançamento.
        </p>
        <div className="dashboard-legend" aria-hidden="true">
          <span>
            <i className="dashboard-income-swatch" />
            Receitas
          </span>
          <span>
            <i className="dashboard-expense-swatch" />
            Despesas
          </span>
        </div>
        <svg
          className="dashboard-daily-chart"
          viewBox="0 0 620 185"
          role="img"
          aria-labelledby="daily-chart-title daily-chart-description"
        >
          <title id="daily-chart-title">
            Receitas e despesas diárias em {monthLabel(summary.month)}
          </title>
          <desc id="daily-chart-description">
            Receitas: {formatCurrency(summary.totalIncome)}. Despesas:{' '}
            {formatCurrency(summary.totalExpense)}. Consulte os valores de cada
            dia na tabela abaixo.
          </desc>
          {[0, 0.5, 1].map((ratio) => (
            <g key={ratio}>
              <line
                x1="0"
                x2="620"
                y1={180 - ratio * 160}
                y2={180 - ratio * 160}
                className="dashboard-chart-grid"
              />
            </g>
          ))}
          {summary.daily.map((day, index) => {
            const width = 620 / summary.daily.length
            return (
              <g key={day.date}>
                <rect
                  x={index * width + width * 0.12}
                  y={180 - (day.totalIncome / maximum) * 160}
                  width={width * 0.32}
                  height={(day.totalIncome / maximum) * 160}
                  className="dashboard-income-bar"
                />
                <rect
                  x={index * width + width * 0.53}
                  y={180 - (day.totalExpense / maximum) * 160}
                  width={width * 0.32}
                  height={(day.totalExpense / maximum) * 160}
                  className="dashboard-expense-bar"
                />
              </g>
            )
          })}
        </svg>
        <div className="dashboard-chart-axis" aria-hidden="true">
          {summary.daily.map((day, index) =>
            index === 0 ||
            (index + 1) % 5 === 0 ||
            index === summary.daily.length - 1 ? (
              <span
                key={day.date}
                style={{
                  left: `${((index + 0.5) / summary.daily.length) * 100}%`,
                }}
              >
                {index + 1}
              </span>
            ) : null,
          )}
        </div>
        <p className="dashboard-chart-scale">
          Escala diária: até {formatCurrency(maximum)}.
        </p>
        <details className="dashboard-chart-details">
          <summary>Ver valores por dia</summary>
          <div className="dashboard-table-scroll">
            <table>
              <caption>
                Movimentação diária de {monthLabel(summary.month)}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Dia</th>
                  <th scope="col">Receitas</th>
                  <th scope="col">Despesas</th>
                </tr>
              </thead>
              <tbody>
                {summary.daily.map((day) => (
                  <tr key={day.date}>
                    <th scope="row">
                      {day.date.slice(8)}/{day.date.slice(5, 7)}
                    </th>
                    <td>{formatCurrency(day.totalIncome)}</td>
                    <td>{formatCurrency(day.totalExpense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
      <section className="dashboard-panel" aria-labelledby="category-title">
        <h2 id="category-title">Despesas por categoria</h2>
        <p className="dashboard-description">
          Onde se concentram os gastos registrados.
        </p>
        {summary.expensesByCategory.length === 0 ? (
          <p className="dashboard-category-empty">
            Nenhuma despesa registrada neste mês.
          </p>
        ) : (
          <ul className="dashboard-categories">
            {summary.expensesByCategory.map((category) => (
              <li key={category.categoryId}>
                <div>
                  <span>{category.categoryName}</span>
                  <strong>{formatCurrency(category.totalExpense)}</strong>
                </div>
                <div className="dashboard-category-track" aria-hidden="true">
                  <span
                    style={{
                      width: `${(category.totalExpense / categoryMaximum) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
