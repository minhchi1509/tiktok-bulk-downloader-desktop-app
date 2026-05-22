import { Pagination, PaginationProps } from '@heroui/react'
import { FC } from 'react'

interface IPaginationProps extends Omit<PaginationProps, 'children'> {
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void | Promise<void>
}

const TablePagination: FC<IPaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
  ...paginationProps
}) => {
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []

    // Nếu ít trang thì show hết
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i)
    }

    // Luôn có trang đầu
    pages.push(0)

    // Ellipsis bên trái
    if (currentPage > 2) {
      pages.push('ellipsis')
    }

    // Pages xung quanh current
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages - 2, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Ellipsis bên phải
    if (currentPage < totalPages - 3) {
      pages.push('ellipsis')
    }

    // Trang cuối
    pages.push(totalPages - 1)

    return pages
  }

  return (
    <Pagination {...paginationProps}>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous
            isDisabled={currentPage === 0}
            onPress={() => onPageChange(Math.max(0, currentPage - 1))}
          >
            <Pagination.PreviousIcon />
          </Pagination.Previous>
        </Pagination.Item>
        {getPageNumbers().map((p, i) =>
          p === 'ellipsis' ? (
            <Pagination.Item key={`ellipsis-${i}`}>
              <Pagination.Ellipsis />
            </Pagination.Item>
          ) : (
            <Pagination.Item key={p}>
              <Pagination.Link isActive={p === currentPage} onPress={() => onPageChange(p)}>
                {p + 1}
              </Pagination.Link>
            </Pagination.Item>
          )
        )}
        <Pagination.Item>
          <Pagination.Next
            isDisabled={currentPage === totalPages - 1}
            onPress={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          >
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  )
}

export default TablePagination
