import Swal from 'sweetalert2'

export function useQuestion(options = {}) {
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-success',
      cancelButton: 'btn btn-danger',
    },
    buttonsStyling: false,
  })

  return new Promise((resolve, reject) => {
    swalWithBootstrapButtons
      .fire({
        title: options.title || 'Are you sure?',
        text: options.text || "You won't be able to revert this!",
        icon: options.icon || 'warning',
        showCancelButton: true,
        confirmButtonText: options.confirmButtonText || 'Yes, delete it!',
        cancelButtonText: options.cancelButtonText || 'No, cancel!',
        reverseButtons: options.reverseButtons ?? true,
      })
      .then((result) => {
        if (result.isConfirmed) {
          if (options.successTitle || options.successText) {
            swalWithBootstrapButtons.fire({
              title: options.successTitle || 'Deleted!',
              text: options.successText || 'Your file has been deleted.',
              icon: 'success',
            })
          }
          resolve(true)
          if (options.onConfirm) options.onConfirm()
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          if (options.cancelTitle || options.cancelText) {
            swalWithBootstrapButtons.fire({
              title: options.cancelTitle || 'Cancelled',
              text: options.cancelText || 'Your imaginary file is safe :)',
              icon: 'error',
            })
          }
          resolve(false)
          if (options.onCancel) options.onCancel()
        }
      })
  })
}

export function useError(options = {}) {
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-danger',
    },
    buttonsStyling: false,
  })

  return swalWithBootstrapButtons.fire({
    icon: 'error',
    title: options.title || 'Oops...',
    text: options.text || 'Something went wrong!',
    footer: options.footer || null,
    confirmButtonText: options.confirmButtonText || 'Ok',
    ...options,
  })
}

export function useSuccess(options = {}) {
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-success',
    },
    buttonsStyling: false,
  })
  return swalWithBootstrapButtons.fire({
    icon: 'success',
    draggable: true,
    title: options.title,
  })
}
